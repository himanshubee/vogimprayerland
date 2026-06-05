"use client";

import { Editor } from "@tinymce/tinymce-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

/**
 * Self-hosted TinyMCE (no cloud API key). Assets are served from /public/tinymce
 * (copied there by scripts/copy-tinymce.mjs on postinstall).
 */
export function TinyEditor({ value, onChange }: Props) {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        height: 620,
        menubar: "edit insert view format table tools",
        branding: false,
        promotion: false,
        skin: "oxide",
        content_css: "default",
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "help",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline forecolor | " +
          "alignleft aligncenter alignright | bullist numlist outdent indent | " +
          "link image media table blockquote | removeformat code fullscreen",
        content_style:
          "body{font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.8;color:#2a1015;} a{color:#9B7421;} h2,h3{font-family:Georgia,serif;color:#7A0E1A;}",
        images_upload_handler: async (blobInfo: {
          blob: () => Blob;
          filename: () => string;
        }) => {
          const fd = new FormData();
          fd.append("file", blobInfo.blob(), blobInfo.filename());
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Image upload failed");
          }
          const data = await res.json();
          return data.location as string;
        },
        automatic_uploads: true,
        file_picker_types: "image",
        image_caption: true,
      }}
    />
  );
}
