import {HandlerRegistry} from '@exo/library/richlink/handler-registry';
import {PageTitleHandler} from '@exo/library/richlink/handlers/page-title.handler';
import {RawUrlHandler} from '@exo/library/richlink/handlers/raw-url.handler';
import {GitHubHandler} from '@exo/library/richlink/handlers/github.handler';
import {GoogleDocsHandler} from '@exo/library/richlink/handlers/google-docs.handler';
import {AtlassianHandler} from '@exo/library/richlink/handlers/atlassian.handler';
import {AirtableHandler} from '@exo/library/richlink/handlers/airtable.handler';
import {SpinnakerHandler} from '@exo/library/richlink/handlers/spinnaker.handler';
import {SpaceliftHandler} from '@exo/library/richlink/handlers/spacelift.handler';

// Export everything
export {HandlerRegistry} from '@exo/library/richlink/handler-registry';
export * from '@exo/library/richlink/base';
export * from '@exo/library/richlink/handlers/page-title.handler';
export * from '@exo/library/richlink/handlers/raw-url.handler';
export * from '@exo/library/richlink/handlers/github.handler';
export * from '@exo/library/richlink/handlers/google-docs.handler';
export * from '@exo/library/richlink/handlers/atlassian.handler';
export * from '@exo/library/richlink/handlers/airtable.handler';
export * from '@exo/library/richlink/handlers/spinnaker.handler';
export * from '@exo/library/richlink/handlers/spacelift.handler';

// Auto-register handlers on module load
HandlerRegistry.registerSpecialized(new GitHubHandler());
HandlerRegistry.registerSpecialized(new GoogleDocsHandler());
HandlerRegistry.registerSpecialized(new AtlassianHandler());
HandlerRegistry.registerSpecialized(new AirtableHandler());
HandlerRegistry.registerSpecialized(new SpinnakerHandler());
HandlerRegistry.registerSpecialized(new SpaceliftHandler());

HandlerRegistry.registerBase(new PageTitleHandler());
HandlerRegistry.registerBase(new RawUrlHandler());
