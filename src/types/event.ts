/**
 * CloudEvents 1.0 types
 */

export interface CloudEvent<T = any> {
  specversion: '1.0';
  id: string;
  source: string;
  type: string;
  subject?: string;
  time?: string;
  datacontenttype?: string;
  dataschema?: string;
  data: T;
}

export interface MeshEventPayload {
  '@context'?: Record<string, string>;
  correlation_id?: string;
  trace_id?: string;
  span_id?: string;
  [key: string]: any;
}
