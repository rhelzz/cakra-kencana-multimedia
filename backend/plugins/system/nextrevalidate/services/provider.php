<?php

\defined('_JEXEC') or die;

use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;
use Joomla\Plugin\System\NextRevalidate\Extension\NextRevalidate;

return new class () implements ServiceProviderInterface {
    public function register(Container $container): void
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new NextRevalidate(
                    (array) PluginHelper::getPlugin('system', 'nextrevalidate')
                );

                // CMSPlugin::__construct() takes only $config; the application is not
                // an argument. Without this call getApplication() returns null and the
                // catch block in ping() fatals instead of reporting the real failure.
                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            }
        );
    }
};
