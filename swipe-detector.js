import { useRef } from "react";
import { useState } from "react";

/*
  Example usage:
  handleEnd = (obj) => {
    console.log("Touch event end. The type of action performed was: ",obj.gesture)
  }
  handleMove = (obj) => {
    console.log("Current drag distance (x axis): ", obj.dragDistance.x)
  }
  handleStart = (obj) => {
    console.log("Touch event beign. Start location (x axis):",obj.dragStartPosition.x)
  }

  <SwipeDetector onEnd={handleEnd} onStart={handleStart} onMove={handleMove}>
    <div>Swipe me</div>
  </Swipe>

  Hooks: onStart, onEnd, onMove
  Returns (all return the same object):
      const obj = {
        dragDistance: { //Distance between drag start and drag end
          x: distanceX,
          y: distanceY
        },
        dragStartPosition: { //Pixel location where drag began
          x: startX,
          y: startY
        },
        gesture: action, //gesture, e.g., swipe_left, swipe_right,
      }
  The 'type' variable will always be 0 for onStart, and will be constantly changing 
  for onMove. The reliable way to determine action is refering to this variable 
  by using onEnd.
*/
export default function SwipeDetector(props) { //TODO: Detecting left and right swipe may need fixing or velocityTrigger needs lower threshold
    const velocityTrigger = 0.2; //At what velocity swipe is recognized
    const noMovementLength = 200; //Stop moving finger for x milliseconds to reset velocity
    const startX= useRef(0);
    const startY = useRef(0);
    const touchX = useRef(0);
    const time = useRef(0);
    const previousX = useRef(0);
    const previousY = useRef(0);
    const initDragX = useRef("");
    const initDragY = useRef("");
    const previousVelocityX = useRef(0);
  
    const VelocityCalculator = (x) => {
      const newTouchX = x;
      const deltaTouchX = newTouchX - touchX.current;
      const noMovementDuration = Date.now() - time.current;
      const deltaT = Date.now() - time.current;
      const velocityX = Math.abs(deltaTouchX / deltaT);
      const prev = Math.abs(previousVelocityX.current);
      if (noMovementDuration > noMovementLength) { //Finger pressed but no movement
        velocityX = 0;
        prev = 0;
      }
      previousVelocityX.current=velocityX;
      touchX.current=newTouchX;
      time.current=Date.now();
    }
    
    function handleTouchStart(event) {
      if (props.stopPropagation) event.stopPropagation();
      startX.current=event.touches[0].clientX;
      startY.current=event.touches[0].clientY;
      previousVelocityX.current=0;
      previousX.current=event.touches[0].clientX;
      previousY.current=event.touches[0].clientY;
      touchX.current=event.touches[0].clientX;
      initDragX.current=="";
      initDragY.current=="";
      time.current = Date.now();
  
      const obj = {
        dragDistance: {
          x: 0,
          y: 0,
        },
        dragDirection: {
          x: "",
          y: "",
        },
        dragStartPosition: {
          x: startX.current,
          y: startY.current,
        },
        type: "",
      }
  
      props.onStart && props.onStart(obj);
    }
  
    function handleTouchEnd(event) {
      if (props.stopPropagation) event.stopPropagation();
      let gesture = calAction(event.changedTouches[0].clientX, event.changedTouches[0].clientY);

      props.onSwipe && gesture.isSwipe && props.onSwipe(gesture);
      props.onScroll && gesture.isVerticalGesture && props.onScroll(gesture)
      props.onEnd && props.onEnd(gesture);
    }
  
  
    const calAction = (endX, endY) => {
      const xDiff = startX.current - endX;
      const yDiff = startY.current - endY;
      const distanceX = endX - startX.current;
      const distanceY = endY - startY.current;
      const angle = Math.atan2(yDiff, xDiff) * (180 / Math.PI);
      const isSwipe = previousVelocityX.current > velocityTrigger;
      const isHorizontalGesture = Math.abs(xDiff) > Math.abs(yDiff);
      const isVerticalGesture = Math.abs(yDiff) > Math.abs(xDiff);
      let action="";

      VelocityCalculator(endX);

      if (isHorizontalGesture) {
        if (angle > -45 && angle <= 45 && isSwipe) {
          action="swipe_left";
        } else if (angle > -45 && angle <= 45) {
          action="move_left";
        } else if ((angle > 135 || angle <= -135) && isSwipe) {
          action="swipe_right";
        } else if (angle > 135 || angle <= -135) {
          action="move_right";
        } else {
          action="";
        }
      } else if (isVerticalGesture) {
        if (angle > 45 && angle <= 135 && isSwipe) {
          action = "swipe_up";
        } else if (angle > 45 && angle <= 135) {
          action = "move_up";
        } else if (angle > -135 && angle <= -45 && isSwipe) {
          action = "swipe_down";
        } else if (angle > -135 && angle <= -45) {
          action = "move_down";
        } else {
          action = "";
        }
      } else {
        action = "unknown";
      }
  
      if (initDragX.current === "" && initDragY.current === "") {
        initDragX.current = endX - previousX.current > 0 ? "right" : "left";
        initDragY.current= endY - previousY.current > 0 ? "down" : "up";
      }

      const obj = {
        dragDistance: {
          x: distanceX,
          y: distanceY
        },
        dragDirection: {
          x: endX - previousX.current > 0 ? "right" : "left",
          y: endY - previousY.current > 0 ? "down" : "up",
        },
        initDragDirection: {
          x: initDragX.current,
          y: initDragY.current,
        },
        dragStartPosition: {
          x: startX.current,
          y: startY.current,
        },
        gesture: action,
        isVerticalGesture: isVerticalGesture,
        isHorizontalGesture: isHorizontalGesture,
        isSwipe: isSwipe,
      }

      previousX.current=endX;
      previousY.current=endY;

      return obj;
    }

    function handleTouchMove(event) {
      if (props.stopPropagation) event.stopPropagation();
      let result = calAction(event.touches[0].clientX, event.touches[0].clientY);
      props.onMove && props.onMove(result);
    }
  
    return (
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {props.children}
      </div>
    );
    }
