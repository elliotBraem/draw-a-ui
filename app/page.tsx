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
    code: string;
    w: number;
    h: number;
  }
>;

class PreviewShape extends BaseBoxShapeUtil<PreviewShapeType> {
  static override type = "preview" as const;

  getDefaultProps(): PreviewShapeType["props"] {
    return {
      code: "",
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
    const webComponentHTML = `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Near social</title>
    <script src="/main.ff64119e7b47ef387a47.bundle.js"></script>
    <script src="/runtime.11b6858f93d8625836ab.bundle.js"></script>
  </head>
  <body>
    <near-social-viewer code="${shape.props.code}"></near-social-viewer>
  </body>
</html>
    `;
    return (
      <HTMLContainer className="tl-embed-container" id={shape.id}>
        <VmComponent src="efiz.near/widget/Tree" />
        {/* <div
          className="tl-embed"
          srcDoc={webComponentHTML}
          width={toDomPrecision(shape.props.w)}
          height={toDomPrecision(shape.props.h)}
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
              ? previousPreviews[0].props.code
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

          // Isolate JSX
          const startPattern = '```jsx';
          const endPattern = '```';
          const startIndex = message.indexOf(startPattern);
  
          if (startIndex === -1) {
            alert("Error parsing JSX from response: " + message);
            return;
          }

          const endIndex = message.indexOf(endPattern, startIndex + startPattern.length);

          if (endIndex === -1) {
            alert("JSX block not properly closed: " + message);
            return;
          }

          let code = message.substring(startIndex + startPattern.length, endIndex).trim();

          // Remove imports
          code = code.replace(/^import.*;$/gm, '');

          // Replace "export default App" with "return App(props);"
          code = code.replace(/export default App;/, 'return App(props);');

          editor.createShape<PreviewShapeType>({
            type: "preview",
            x: previewPosition.x,
            y: previewPosition.y,
            props: { code },
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
