<?php

namespace Joomla\Plugin\System\NextRevalidate\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Http\HttpFactory;
use Joomla\CMS\Plugin\CMSPlugin;

/**
 * Tells the Next.js frontend to drop its cached pages as soon as content changes,
 * so editors see their edit immediately instead of waiting for the ISR window.
 */
final class NextRevalidate extends CMSPlugin
{
    /** Articles, categories, contacts — anything saved through com_content & friends. */
    public function onContentAfterSave($context, $item, $isNew): void
    {
        $this->ping();
    }

    public function onContentAfterDelete($context, $item): void
    {
        $this->ping();
    }

    public function onContentChangeState($context, $pks, $value): void
    {
        $this->ping();
    }

    /** Menu items are extensions, not content — they fire this one instead. */
    public function onExtensionAfterSave($context, $item, $isNew): void
    {
        $this->ping();
    }

    private function ping(): void
    {
        $url    = (string) $this->params->get('url');
        $secret = (string) $this->params->get('secret');

        if ($url === '' || $secret === '') {
            return;
        }

        try {
            // Short timeout: a slow or dead frontend must never block saving in Joomla.
            HttpFactory::getHttp()->post(
                $url . '?secret=' . urlencode($secret),
                '',
                ['Content-Type' => 'application/json'],
                5
            );
        } catch (\Throwable $e) {
            // Reporting must never be able to fatal: saving an article has to survive a
            // dead frontend. There is no application in every context this plugin runs in.
            $app = $this->getApplication();

            if ($app !== null) {
                $app->enqueueMessage('Next.js revalidate failed: ' . $e->getMessage(), 'warning');
            }
        }
    }
}
