/* eslint-disable react-hooks/rules-of-hooks */

"use client";

import { VmComponent } from "@/components/vm/VmComponent";
import { blobToBase64 } from "@/lib/blobToBase64";
import { getSvgAsImage } from "@/lib/getSvgAsImage";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  TLBaseShape,
  toDomPrecision,
  useEditor,
  useExportAs,
  useIsEditing,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import dynamic from "next/dynamic";
import { useState } from "react";

type PreviewShapeType = TLBaseShape<
  "preview",
  {
    html: string;
    w: number;
    h: number;
  }
>;

class PreviewShape extends BaseBoxShapeUtil<PreviewShapeType> {
  static override type = "preview" as const;

  getDefaultProps(): PreviewShapeType["props"] {
    return {
      html: "",
      w: (960 * 2) / 3,
      h: (540 * 2) / 3,
    };
  }

  override canEdit = () => true;
  override isAspectRatioLocked = (_shape: PreviewShapeType) => false;
  override canResize = (_shape: PreviewShapeType) => true;
  override canBind = (_shape: PreviewShapeType) => false;

  override component(shape: PreviewShapeType) {
    const isEditing = useIsEditing(shape.id);
    return (
      <HTMLContainer className="tl-embed-container" id={shape.id}>
        <VmComponent src="efiz.near/widget/Tree" />
        {/* <div
          className="tl-embed"
          draggable={false}
          style={{
            border: 0,
            pointerEvents: isEditing ? "auto" : "none",
            width: toDomPrecision(shape.props.w),
            height: toDomPrecision(shape.props.h),
          }}
        >
          
        </div> */}
      </HTMLContainer>
    );
  }

  indicator(shape: PreviewShapeType) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

const Tldraw = dynamic(async () => (await import("@tldraw/tldraw")).Tldraw, {
  ssr: false,
});

const VmInitializer = dynamic(() => import("../components/vm/VmInitializer"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <div className={`w-screen h-screen`}>
        <Tldraw persistenceKey="tldraw" shapeUtils={[PreviewShape]}>
          <ExportButton />
        </Tldraw>
      </div>
    </>
  );
}

function ExportButton(/*{ setHtml }: { setHtml: (html: string) => void }*/) {
  const editor = useEditor();
  const [loading, setLoading] = useState(false);
  const exportAs = useExportAs();
  // A tailwind styled button that is pinned to the bottom right of the screen
  return (
    <button
      onClick={async (e) => {
        setLoading(true);
        try {
          e.preventDefault();

          const previewPosition = editor.selectedShapes.reduce(
            (acc, shape) => {
              const bounds = editor.getShapePageBounds(shape);
              const right = bounds?.maxX ?? 0;
              const top = bounds?.minY ?? 0;
              return {
                x: Math.max(acc.x, right),
                y: Math.min(acc.y, top),
              };
            },
            { x: 0, y: Infinity }
          );

          const previousPreviews = editor.selectedShapes.filter((shape) => {
            return shape.type === "preview";
          }) as PreviewShapeType[];

          if (previousPreviews.length > 1) {
            throw new Error(
              "You can only give the developer one previous design to work with."
            );
          }

          const previousHtml =
            previousPreviews.length === 1
              ? previousPreviews[0].props.html
              : "No previous design has been provided this time.";

          const svg = await editor.getSvg(editor.selectedShapeIds);
          if (!svg) {
            return;
          }

          const png = await getSvgAsImage(svg, {
            type: "png",
            quality: 1,
            scale: 1,
          });
          const dataUrl = await blobToBase64(png!);
          const resp = await fetch("/api/toHtml", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: dataUrl,
              html: previousHtml,
            }),
          });

          const json = await resp.json();

          if (json.error) {
            alert("Error from open ai: " + JSON.stringify(json.error));
            return;
          }

          const message = json.choices[0].message.content;
          const start = message.indexOf("<!DOCTYPE html>");
          const end = message.indexOf("</html>");
          const html = message.slice(start, end + "</html>".length);

          editor.createShape<PreviewShapeType>({
            type: "preview",
            x: previewPosition.x,
            y: previewPosition.y,
            props: { html },
          });

          // setHtml(html);
        } finally {
          setLoading(false);
        }
      }}
      className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ="
      style={{ zIndex: 1000 }}
    >
      {loading ? (
        <div className="flex justify-center items-center ">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      ) : (
        "Make Real"
      )}
    </button>
  );
}
