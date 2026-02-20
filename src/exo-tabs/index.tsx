// Auto-discover and import all *.tab.tsx files (side-effect: triggers TabRegistry.register)
import.meta.glob('./*.tab.tsx', {eager: true});
