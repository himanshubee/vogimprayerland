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
        // Keep image src as the absolute "/images/uploads/..." path returned by
        // the API. Without this, TinyMCE rewrites it relative to the deep admin
        // page URL (/admin/posts/new/), producing a broken src that won't load.
        convert_urls: false,
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
          // Trailing slash: project sets trailingSlash:true, so POST to the
          // canonical path to avoid a 308 redirect of the multipart body.
          const res = await fetch("/api/upload/", { method: "POST", body: fd });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Image upload failed");
          }
          const data = await res.json();
          return data.location as string;
        },
        automatic_uploads: true,
        file_picker_types: "image",
        // Adds an "Upload" tab / browse button to the Insert-Image dialog.
        // Without this, the image toolbar button only offers a URL field;
        // images_upload_handler alone covers paste & drag-and-drop only.
        file_picker_callback: (
          callback: (url: string, meta?: { title?: string }) => void,
        ) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              // Hand TinyMCE a blob URI; automatic_uploads then routes it
              // through images_upload_handler -> /api/upload.
              const id = `blobid${new Date().getTime()}`;
              const blobCache =
                // @ts-expect-error - activeEditor is available at call time
                window.tinymce.activeEditor.editorUpload.blobCache;
              const base64 = (reader.result as string).split(",")[1];
              const blobInfo = blobCache.create(id, file, base64);
              blobCache.add(blobInfo);
              callback(blobInfo.blobUri(), { title: file.name });
            };
            reader.readAsDataURL(file);
          };
          input.click();
        },
        image_caption: true,
      }}
    />
  );
}
