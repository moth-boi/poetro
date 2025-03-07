import { memo, useRef } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useMemoStore } from "@/store/v1";
import { Node, NodeType } from "@/types/node";
import Renderer from "./Renderer";
import { RendererContext } from "./types";

interface Props {
  content: string;
  memoId?: number;
  readonly?: boolean;
  disableFilter?: boolean;
  // embeddedMemos is a set of memo resource names that are embedded in the current memo.
  // This is used to prevent infinite loops when a memo embeds itself.
  embeddedMemos?: Set<string>;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const MemoContent: React.FC<Props> = (props: Props) => {
  const { className, content, memoId, embeddedMemos, onClick } = props;
  const currentUser = useCurrentUser();
  const memoStore = useMemoStore();
  const memoContentContainerRef = useRef<HTMLDivElement>(null);
  const nodes = window.parse(content);
  const allowEdit = !props.readonly && memoId && currentUser?.id === memoStore.getMemoById(memoId)?.creatorId;

  const handleMemoContentClick = async (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  let prevNode: Node | null = null;
  let skipNextLineBreakFlag = false;

  return (
    <RendererContext.Provider
      value={{
        nodes,
        memoId,
        readonly: !allowEdit,
        disableFilter: props.disableFilter,
        embeddedMemos: embeddedMemos || new Set(),
      }}
    >
      <div className={`w-full flex flex-col justify-start items-start text-gray-800 dark:text-gray-300 ${className || ""}`}>
        <div
          ref={memoContentContainerRef}
          className="w-full max-w-full word-break text-base leading-6 space-y-1 whitespace-pre-wrap"
          onClick={handleMemoContentClick}
        >
          {nodes.map((node, index) => {
            if (prevNode?.type !== NodeType.LINE_BREAK && node.type === NodeType.LINE_BREAK && skipNextLineBreakFlag) {
              skipNextLineBreakFlag = false;
              return null;
            }

            prevNode = node;
            skipNextLineBreakFlag = true;
            return <Renderer key={`${node.type}-${index}`} index={String(index)} node={node} />;
          })}
        </div>
      </div>
    </RendererContext.Provider>
  );
};

export default memo(MemoContent);
