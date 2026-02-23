import {HandlerRegistry} from '@exo/exo-tabs/richlink/handler-registry';
import {PageTitleHandler} from '@exo/exo-tabs/richlink/handlers/page-title.handler';
import {RawUrlHandler} from '@exo/exo-tabs/richlink/handlers/raw-url.handler';
import {GitHubHandler} from '@exo/exo-tabs/richlink/handlers/github.handler';
import {GoogleDocsHandler} from '@exo/exo-tabs/richlink/handlers/google-docs.handler';
import {AtlassianHandler} from '@exo/exo-tabs/richlink/handlers/atlassian.handler';
import {AirtableHandler} from '@exo/exo-tabs/richlink/handlers/airtable.handler';
import {SpinnakerHandler} from '@exo/exo-tabs/richlink/handlers/spinnaker.handler';
import {SpaceliftHandler} from '@exo/exo-tabs/richlink/handlers/spacelift.handler';
import {BuildkiteHandler} from '@exo/exo-tabs/richlink/handlers/buildkite.handler';

// Export everything
export {HandlerRegistry} from '@exo/exo-tabs/richlink/handler-registry';
export * from '@exo/exo-tabs/richlink/base';
export * from '@exo/exo-tabs/richlink/handlers/page-title.handler';
export * from '@exo/exo-tabs/richlink/handlers/raw-url.handler';
export * from '@exo/exo-tabs/richlink/handlers/github.handler';
export * from '@exo/exo-tabs/richlink/handlers/google-docs.handler';
export * from '@exo/exo-tabs/richlink/handlers/atlassian.handler';
export * from '@exo/exo-tabs/richlink/handlers/airtable.handler';
export * from '@exo/exo-tabs/richlink/handlers/spinnaker.handler';
export * from '@exo/exo-tabs/richlink/handlers/spacelift.handler';
export * from '@exo/exo-tabs/richlink/handlers/buildkite.handler';

// Auto-register handlers on module load
HandlerRegistry.registerSpecialized(new GitHubHandler());
HandlerRegistry.registerSpecialized(new GoogleDocsHandler());
HandlerRegistry.registerSpecialized(new AtlassianHandler());
HandlerRegistry.registerSpecialized(new AirtableHandler());
HandlerRegistry.registerSpecialized(new SpinnakerHandler());
HandlerRegistry.registerSpecialized(new SpaceliftHandler());
HandlerRegistry.registerSpecialized(new BuildkiteHandler());

HandlerRegistry.registerBase(new PageTitleHandler());
HandlerRegistry.registerBase(new RawUrlHandler());
