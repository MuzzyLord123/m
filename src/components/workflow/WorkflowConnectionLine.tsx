interface Props {
  id?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isPending?: boolean;
  onDelete?: (id: string) => void;
}

export function WorkflowConnectionLine({ id, startX, startY, endX, endY, isPending, onDelete }: Props) {
  const dx = Math.abs(endX - startX) * 0.5;
  const path = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

  return (
    <g className={isPending ? 'pointer-events-none' : 'group/conn cursor-pointer'}>
      {/* Invisible thick path for easier clicking */}
      {!isPending && id && (
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(id);
          }}
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={isPending ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--muted-foreground) / 0.4)'}
        strokeWidth={2}
        strokeDasharray={isPending ? '6 4' : 'none'}
        className={!isPending ? 'group-hover/conn:stroke-destructive transition-colors' : ''}
      />
      {/* Arrow at end */}
      {!isPending && (
        <circle
          cx={endX}
          cy={endY}
          r={3}
          fill="hsl(var(--muted-foreground) / 0.4)"
          className="group-hover/conn:fill-destructive transition-colors"
        />
      )}
    </g>
  );
}
