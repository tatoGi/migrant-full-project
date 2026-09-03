<?php

namespace Tests\Feature;

use App\Clients\FlittClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FlittClientTest extends TestCase
{
    private function client(): FlittClient
    {
        return new FlittClient('https://pay.flitt.com/api/', 1549901, 'test');
    }

    public function test_create_order_sends_request_signed_per_flitt_documented_example(): void
    {
        Http::fake([
            'pay.flitt.com/*' => Http::response([
                'response' => ['checkout_url' => 'https://pay.flitt.com/merchants/x', 'response_status' => 'success'],
            ]),
        ]);

        $client = $this->client();

        $result = $client->createOrder([
            'order_id' => 'TestOrder2',
            'amount' => 1000,
            'currency' => 'GEL',
            'order_desc' => 'Test payment',
            'server_callback_url' => 'http://myshop/callback/',
        ]);

        $this->assertSame('https://pay.flitt.com/merchants/x', $result['checkout_url']);

        $expectedSignature = sha1('test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/');

        Http::assertSent(function ($request) use ($expectedSignature) {
            $body = $request->data()['request'];

            return $request->url() === 'https://pay.flitt.com/api/checkout/url'
                && $body['merchant_id'] === 1549901
                && $body['signature'] === $expectedSignature;
        });
    }

    public function test_cancel_subscription_sends_stop_action_to_subscription_endpoint(): void
    {
        Http::fake([
            'pay.flitt.com/*' => Http::response(['response' => ['status' => 'disabled']]),
        ]);

        $this->client()->cancelSubscription('order-abc');

        Http::assertSent(function ($request) {
            $body = $request->data()['request'];

            return $request->url() === 'https://pay.flitt.com/api/subscription'
                && $body['order_id'] === 'order-abc'
                && $body['action'] === 'stop';
        });
    }

    public function test_verify_signature_accepts_valid_and_rejects_tampered_payload(): void
    {
        $client = $this->client();

        $payload = [
            'amount' => 1000,
            'currency' => 'GEL',
            'merchant_id' => 1549901,
            'order_id' => 'TestOrder2',
            'order_status' => 'approved',
        ];
        $payload['signature'] = sha1('test|1000|GEL|1549901|TestOrder2|approved');

        $this->assertTrue($client->verifySignature($payload));

        $tampered = $payload;
        $tampered['amount'] = 9999;

        $this->assertFalse($client->verifySignature($tampered));
    }

    public function test_verify_signature_rejects_missing_signature(): void
    {
        $this->assertFalse($this->client()->verifySignature(['order_id' => 'x']));
    }
}
