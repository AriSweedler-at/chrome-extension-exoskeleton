import {HandlerRegistry} from '../handler-registry';
import {PageTitleHandler} from './page-title.handler';
import {RawUrlHandler} from './raw-url.handler';
import {GitHubHandler} from './github.handler';
import {GoogleDocsHandler} from './google-docs.handler';
import {AtlassianHandler} from './atlassian.handler';
import {AirtableHandler} from './airtable.handler';
import {SpinnakerHandler} from './spinnaker.handler';
import {SpaceliftHandler} from './spacelift.handler';

// Export everything
export {HandlerRegistry} from '../handler-registry';
export * from '../base';
export * from './page-title.handler';
export * from './raw-url.handler';
export * from './github.handler';
export * from './google-docs.handler';
export * from './atlassian.handler';
export * from './airtable.handler';
export * from './spinnaker.handler';
export * from './spacelift.handler';

// Auto-register handlers on module load
HandlerRegistry.registerSpecialized(new GitHubHandler());
HandlerRegistry.registerSpecialized(new GoogleDocsHandler());
HandlerRegistry.registerSpecialized(new AtlassianHandler());
HandlerRegistry.registerSpecialized(new AirtableHandler());
HandlerRegistry.registerSpecialized(new SpinnakerHandler());
HandlerRegistry.registerSpecialized(new SpaceliftHandler());

HandlerRegistry.registerBase(new PageTitleHandler());
HandlerRegistry.registerBase(new RawUrlHandler());
