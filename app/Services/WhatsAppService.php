<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send WhatsApp message via Fonnte API.
     */
    public function send(string $phoneNumber, string $message): bool
    {
        $provider = config('whatsapp.provider');

        if ($provider === 'fonnte') {
            return $this->sendViaFonnte($phoneNumber, $message);
        }

        Log::warning("WhatsApp provider '{$provider}' not supported.");
        return false;
    }

    /**
     * Send via Fonnte HTTP API.
     */
    private function sendViaFonnte(string $phoneNumber, string $message): bool
    {
        $apiUrl = config('whatsapp.fonnte.api_url');
        $token = config('whatsapp.fonnte.token');

        if (empty($token)) {
            Log::warning('Fonnte token is not configured. Skipping WA notification.');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post($apiUrl, [
                'target' => $phoneNumber,
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info("WA sent to {$phoneNumber}");
                return true;
            }

            Log::error("WA send failed: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error("WA send exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Build message from template.
     */
    public function buildMessage(string $templateKey, array $data): string
    {
        $template = config("whatsapp.templates.{$templateKey}", '');

        foreach ($data as $key => $value) {
            $template = str_replace("{{$key}}", $value, $template);
        }

        return $template;
    }
}
