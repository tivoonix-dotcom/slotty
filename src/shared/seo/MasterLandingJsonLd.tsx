import { JsonLd } from './JsonLd';
import { MASTER_LANDING_STRUCTURED_DATA } from './masterLandingStructuredData';

/** Structured data for master landing `/master/start`. */
export function MasterLandingJsonLd() {
  return <JsonLd data={MASTER_LANDING_STRUCTURED_DATA} />;
}
