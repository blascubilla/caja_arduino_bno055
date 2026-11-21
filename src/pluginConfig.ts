import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-itrip',
    version: '0.1.0',
    icon: '⛵',
    title: 'iTrip sobre viento',
    description:
        'Muestra el track, la posición y el rumbo (BNO055) del iTrip sobre la capa de viento de Windy, con viento real y ángulo al viento en la posición del barco.',
    author: 'blascubilla',
    repository: 'https://github.com/blascubilla/caja_arduino_bno055',
    desktopUI: 'rhpane',
    mobileUI: 'small',
    desktopWidth: 260,
    routerPath: '/itrip',
    private: true,
};

export default config;
