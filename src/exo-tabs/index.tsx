// Auto-discover and import all tab registrations (side-effect: triggers TabRegistry.register)
import.meta.glob('./*/tab.tsx', {eager: true});
