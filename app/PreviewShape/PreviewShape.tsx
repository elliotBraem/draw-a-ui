/* eslint-disable react-hooks/rules-of-hooks */
import {
	BaseBoxShapeUtil,
	DefaultSpinner,
	HTMLContainer,
	Icon,
	TLBaseShape,
	stopEventPropagation,
	toDomPrecision,
	useIsEditing,
	useToasts
} from "@tldraw/tldraw";

export type PreviewShape = TLBaseShape<
  "preview",
  {
    html: string;
    source: string;
    w: number;
    h: number;
  }
>;
export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
  static override type = "preview" as const;

  getDefaultProps(): PreviewShape["props"] {
    return {
      html: "",
      source: "",
      w: (960 * 2) / 3,
      h: (540 * 2) / 3,
    };
  }

  override canEdit = () => true;
  override isAspectRatioLocked = (_shape: PreviewShape) => false;
  override canResize = (_shape: PreviewShape) => true;
  override canBind = (_shape: PreviewShape) => false;

  override component(shape: PreviewShape) {
    const isEditing = useIsEditing(shape.id);
    const toast = useToasts();

    const webComponentHTML = ` // I'm not going to pass this in yet, because I think near-social-viewer should come from the AI
			<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width,initial-scale=1">
			<title>Near social</title>
	
			// Keep these up to date with latest petersalomonsen/near-bos-webcomponent
			
		</head>
		<body>
			// code mappings? 
			<near-social-viewer code="{shape.props.code}"></near-social-viewer> // this can be replaced with code
		</body>
	</html>
			`;

    return (
      <HTMLContainer className="tl-embed-container" id={shape.id}>
        {shape.props.html ? (
          <iframe
            className="tl-embed"
            srcDoc={shape.props.html}
            width={toDomPrecision(shape.props.w)}
            height={toDomPrecision(shape.props.h)}
            draggable={false}
            style={{
              border: 0,
              pointerEvents: isEditing ? "auto" : "none",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "var(--color-muted-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-muted-1)",
            }}
          >
            <DefaultSpinner />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: -40,
            height: 40,
            width: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            pointerEvents: "all",
          }}
          onClick={() => {
            if (navigator && navigator.clipboard) {
              navigator.clipboard.writeText(shape.props.html);
              toast.addToast({
                icon: "duplicate",
                title: "Copied to clipboard",
              });
            }
          }}
          onPointerDown={stopEventPropagation}
        >
          <Icon icon="duplicate" />
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: PreviewShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}
