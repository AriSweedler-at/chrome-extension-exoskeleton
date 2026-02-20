import {ReactElement} from 'react';

export abstract class Component {
    abstract render(): ReactElement;

    onMount?(): void;
    onUnmount?(): void;

    static renderInstance(ComponentClass: typeof Component): ReactElement {
        const instance = new (ComponentClass as unknown as new () => Component)();

        if (instance.onMount) {
            instance.onMount();
        }

        return instance.render();
    }
}
