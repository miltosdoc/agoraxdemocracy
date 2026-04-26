import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
import { useTranslation } from "@/hooks/use-translation";

interface RankableItem {
  id: number;
  text: string;
}

interface RankingVoteProps {
  options: RankableItem[];
  onChange: (orderedOptionIds: number[]) => void;
}

export function RankingVote({ options, onChange }: RankingVoteProps) {
  const { t } = useTranslation();
  // We create a copy of the options array because we'll be reordering it
  const [items, setItems] = useState<RankableItem[]>([...options]);

  // Handle the end of a drag event
  const onDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    // If the item was dropped in the same place, do nothing
    if (sourceIndex === destinationIndex) {
      return;
    }

    // Create a new array with the reordered items
    const newItems = [...items];
    const [removed] = newItems.splice(sourceIndex, 1);
    newItems.splice(destinationIndex, 0, removed);

    // Update state
    setItems(newItems);

    // Notify parent component of the new order
    onChange(newItems.map(item => item.id));
  };

  return (
    <div className="mt-4">
      <p className="text-sm font-medium mb-2">
        {t("Drag and drop the options to rank them from most to least preferred")}
      </p>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="ranking-list">
          {(provided: DroppableProvided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((option, index) => (
                <Draggable
                  key={option.id.toString()}
                  draggableId={option.id.toString()}
                  index={index}
                >
                  {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        flex items-center p-4 border rounded 
                        ${snapshot.isDragging ? 'bg-accent/20 border-accent' : 'bg-background border-border hover:bg-accent/10'}
                      `}
                    >
                      <div className="mr-3 text-muted-foreground font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">{option.text}</div>
                      <div className="text-muted-foreground ml-2">
                        <svg 
                          width="18" 
                          height="18" 
                          viewBox="0 0 15 15" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className="opacity-60"
                        >
                          <path 
                            d="M5.5 4.625C5.5 4.97018 5.22018 5.25 4.875 5.25C4.52982 5.25 4.25 4.97018 4.25 4.625C4.25 4.27982 4.52982 4 4.875 4C5.22018 4 5.5 4.27982 5.5 4.625ZM5.5 7.625C5.5 7.97018 5.22018 8.25 4.875 8.25C4.52982 8.25 4.25 7.97018 4.25 7.625C4.25 7.27982 4.52982 7 4.875 7C5.22018 7 5.5 7.27982 5.5 7.625ZM5.5 10.625C5.5 10.9702 5.22018 11.25 4.875 11.25C4.52982 11.25 4.25 10.9702 4.25 10.625C4.25 10.2798 4.52982 10 4.875 10C5.22018 10 5.5 10.2798 5.5 10.625ZM10.5 4.625C10.5 4.97018 10.2202 5.25 9.875 5.25C9.52982 5.25 9.25 4.97018 9.25 4.625C9.25 4.27982 9.52982 4 9.875 4C10.2202 4 10.5 4.27982 10.5 4.625ZM10.5 7.625C10.5 7.97018 10.2202 8.25 9.875 8.25C9.52982 8.25 9.25 7.97018 9.25 7.625C9.25 7.27982 9.52982 7 9.875 7C10.2202 7 10.5 7.27982 10.5 7.625ZM10.5 10.625C10.5 10.9702 10.2202 11.25 9.875 11.25C9.52982 11.25 9.25 10.9702 9.25 10.625C9.25 10.2798 9.52982 10 9.875 10C10.2202 10 10.5 10.2798 10.5 10.625Z" 
                            fill="currentColor" 
                            fillRule="evenodd" 
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}