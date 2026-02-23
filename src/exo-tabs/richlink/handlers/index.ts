import {Handler} from '@exo/exo-tabs/richlink/base';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handler-registry';

export {HandlerRegistry} from '@exo/exo-tabs/richlink/handler-registry';
export * from '@exo/exo-tabs/richlink/base';

// Auto-discover and register all *.handler.ts files in this directory.
// To add a new handler, just create a new *.handler.ts file — no other changes needed.
const modules = import.meta.glob('./*.handler.ts', {eager: true}) as Record<
    string,
    Record<string, unknown>
>;

for (const mod of Object.values(modules)) {
    for (const exported of Object.values(mod)) {
        if (typeof exported === 'function' && exported.prototype instanceof Handler) {
            HandlerRegistry.register(new (exported as new () => Handler)());
        }
    }
}
