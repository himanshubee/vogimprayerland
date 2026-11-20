# Tracking plan

No event may contain a name, email, phone, request text, health or family detail, city, religious condition, donor identity or free-text search. Events are pushed to the local `dataLayer`; GA4/GTM scripts load only after analytics consent.

| Event | Trigger | Allowed parameters | Owner |
|---|---|---|---|
| `cta_click` | Prayer, service or content CTA activation | `page_type`, `cta_id`, `cta_text`, `cta_location` | Web |
| `service_bar_view` | Service bar becomes visible | `page_type` | Web |
| `service_bar_click` | Service-bar Zoom link | `cta_id`, `cta_location` | Web |
| `service_bar_dismiss` | Announcement dismissed | `page_type` | Web |
| `sticky_cta_click` | Mobile prayer CTA | `cta_id`, `cta_location` | Web |
| `prayer_request_start` | First prayer-form interaction | `page_type` | Web |
| `prayer_request_submit` | Successful prayer request | `page_type` | Web |
| `healing_request_submit` | Successful healing request | `page_type` | Web |
| `deliverance_request_submit` | Successful deliverance request | `page_type` | Web |
| `dream_request_submit` | Successful dream request | `page_type` | Web |
| `marital_request_submit` | Successful marital request | `page_type` | Web |
| `contact_submit` | Successful contact form | `topic` from a fixed option list only | Web |
| `join_service_click` | Zoom join activation | `service`: `monday`, `wednesday`, `saturday` | Web |
| `add_to_calendar` | Calendar file download | `service` | Web |
| `whatsapp_click` | Neutral WhatsApp link | `page_type` | Web |
| `give_start` | Valid gift proceeds to details | `currency` | Finance |
| `give_complete` | Verified, deduplicated gateway webhook | `currency`, `value`, `transaction_id`, `fund` | Finance |
| `partner_form_submit` | Successful partnership enquiry | `level` only when fixed levels are restored | Finance |
| `refund_request` | Successful refund form | No free text or contact data | Finance |
| `refund` | Verified refund processing | `transaction_id` | Finance |
| `view_item`, `add_to_cart`, `begin_checkout` | Store journey | Fixed item ID, value and currency | Store |
| `purchase` | Verified, deduplicated store webhook | Fixed item IDs, value, currency, transaction ID | Store |
| `faq_search` | FAQ search | Fixed category only; never raw query | Content |
| `faq_expand`, `faq_helpful` | FAQ interaction | `question_id`, `value` | Content |
| `video_start`, `video_progress`, `video_complete` | Media interaction | Fixed `video_title`, `percent` | Media |
| `consent_update` | Consent choice changes | Boolean category names; no identifiers | Privacy |
| `web_vitals` | LCP, INP or CLS measurement | `metric_name`, `value`, `rating`, `page_type` | Web |

## Required QA

Use GTM Preview and GA4 DebugView with analytics denied and granted. Confirm no network request to Google before consent. Complete gateway tests only in sandbox/test mode. Deduplicate gift and purchase events by transaction reference. Keep reply-time measurement in the protected admin system, not GA4.
