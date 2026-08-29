import { GarmentMockup, type GarmentMockupProps } from "./GarmentMockup";
import { PhotoMockup } from "./PhotoMockup";
import type { CategoryTemplates } from "@/lib/merch-shared";

/**
 * The one way the store shows a garment.
 *
 * Where the ministry has uploaded a photo for this angle, the real photo is
 * composited (see PhotoMockup); where it has not, the drawn garment stands in
 * (see GarmentMockup). The close-up is the front photo, magnified around the
 * print. Callers never need to know which they got.
 */
export function Mockup({
  templates,
  ...props
}: GarmentMockupProps & { templates?: CategoryTemplates }) {
  const { category, view, color, design, className, title } = props;
  const align = category === "tshirt" ? "top" : "center";

  const template = templates?.[view];
  if (template) {
    return (
      <PhotoMockup
        template={template}
        color={color}
        design={design}
        className={className}
        title={title}
        align={align}
        print={props.print}
        showDesign={template.showDesign}
      />
    );
  }

  if (view === "detail" && templates?.front) {
    return (
      <PhotoMockup
        template={templates.front}
        color={color}
        design={design}
        className={className}
        title={title}
        align={align}
        zoom={2.2}
        print={props.print}
        showDesign={templates.front.showDesign}
      />
    );
  }

  return <GarmentMockup {...props} />;
}
