import {ReactElement} from 'react';

export abstract class Component {
    abstract render(): ReactElement;

    onMount?(): void;
    onUnmount?(): void;

    static renderInstance<T extends Component>(
        ComponentClass: new () => T,
    ): ReactElement {
        const instance = new ComponentClass();

        if (instance.onMount) {
            instance.onMount();
        }

        return instance.render();
    }
}
