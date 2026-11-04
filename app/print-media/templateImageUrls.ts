/**
 * Backwards-compatible local preview list.
 * The Print Media gallery now uses the first-party SVG/JSON template catalogue.
 */
import { PRINT_MEDIA_TEMPLATES } from "./templateCatalog";

export const TEMPLATE_IMAGE_URLS = PRINT_MEDIA_TEMPLATES.map((template) => template.previewUrl);
