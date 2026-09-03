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
        $response = Http::asJson()->post($this->baseUrl.'checkout/url', [
            'request' => $this->signedRequest($params),
        ]);

        return $response->json('response', []);
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
