<?php

namespace App\Clients;

use Illuminate\Support\Facades\Http;

class FlittClient
{
    private string $baseUrl;

    private int $merchantId;

    private string $paymentKey;

    public function __construct(?string $baseUrl = null, ?int $merchantId = null, ?string $paymentKey = null)
    {
        $this->baseUrl = $baseUrl ?? config('flitt.base_url');
        $this->merchantId = $merchantId ?? (int) config('flitt.merchant_id');
        $this->paymentKey = $paymentKey ?? (string) config('flitt.payment_key');
    }

    public function createOrder(array $params): array
    {
        // Flitt accepts nested recurring_data only via API protocol 2.0 (base64 order + signature).
        if (isset($params['recurring_data'])) {
            return $this->createOrderV2($params);
        }

        $response = Http::asJson()->post($this->baseUrl.'checkout/url', [
            'request' => $this->signedRequest($params),
        ]);

        return $response->json('response', []);
    }

    /**
     * Returns the payload of a verified callback (flat v1.0 or base64 v2.0), or null if the signature is invalid.
     */
    public function decodeCallback(array $payload): ?array
    {
        if (isset($payload['data'], $payload['signature']) && ! isset($payload['order_id'])) {
            if (! hash_equals(sha1($this->paymentKey.'|'.$payload['data']), (string) $payload['signature'])) {
                return null;
            }

            $order = json_decode(base64_decode((string) $payload['data']), true)['order'] ?? null;

            return is_array($order) ? $order : null;
        }

        return $this->verifySignature($payload) ? $payload : null;
    }

    private function createOrderV2(array $params): array
    {
        $params['merchant_id'] = $this->merchantId;
        $data = base64_encode(json_encode(['order' => $params]));

        $response = Http::asJson()->post($this->baseUrl.'checkout/url', [
            'request' => [
                'version' => '2.0',
                'data' => $data,
                'signature' => sha1($this->paymentKey.'|'.$data),
            ],
        ])->json('response', []);

        if (isset($response['data'])) {
            return json_decode(base64_decode((string) $response['data']), true)['order'] ?? [];
        }

        return $response;
    }

    public function cancelSubscription(string $orderId): array
    {
        $response = Http::asJson()->post($this->baseUrl.'subscription', [
            'request' => $this->signedRequest([
                'order_id' => $orderId,
                'action' => 'stop',
            ]),
        ]);

        return $response->json('response', []);
    }

    public function verifySignature(array $payload): bool
    {
        $received = (string) ($payload['signature'] ?? '');

        if ($received === '') {
            return false;
        }

        return hash_equals($this->buildSignature($payload), $received);
    }

    private function signedRequest(array $params): array
    {
        $params['merchant_id'] = $this->merchantId;
        $params['signature'] = $this->buildSignature($params);

        return $params;
    }

    private function buildSignature(array $params): string
    {
        $scalarParams = array_filter(
            $params,
            fn ($value, $key) => $key !== 'signature' && $value !== null && $value !== '' && ! is_array($value),
            ARRAY_FILTER_USE_BOTH
        );

        ksort($scalarParams);

        $values = array_values($scalarParams);
        array_unshift($values, $this->paymentKey);

        return sha1(implode('|', $values));
    }
}
