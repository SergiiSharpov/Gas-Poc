import TWEEN from '@tweenjs/tween.js';

export const groupTweens = (...tweens) => {
  //let first = tweens[0];
  let current = tweens[0];
  
  for(let i = 1; i < tweens.length; i++) {
    current.chain(tweens[i]);
    current = tweens[i];
  }
  
  return {first: tweens[0], last: current};
};

export const onGroupComplete = (group, callback) => {
  if (group._chainedTweens.length) {
    let completed = 0;
    let total = group._chainedTweens.length - 1;
    
    for (let tween of group._chainedTweens) {
      if (tween._chainedTweens.length) {
        let childCompleted = 0;
        let childTotal = tween._chainedTweens.length - 1;
        
        onGroupComplete(tween, () => {
          childCompleted++;
  
          if (childCompleted >= childTotal) {
            completed++;
  
            if (completed >= total) {
              callback();
            }
          }
        })
      } else {
        tween.onComplete(() => {
          completed++;
    
          if (completed >= total) {
            callback();
          }
        });
      }
    }
  } else {
    group.onComplete(callback);
  }
};

export const chainedTweens = (...tweens) => {
  let prev = null;
  let first = null;
  
  for (let tween of tweens) {
    if (prev) {
      onGroupComplete(prev, () => tween.start());
      prev = tween;
    } else {
      first = tween;
      prev = tween;
    }
  }
  
  return first;
};

export const controlsTargetTween = (controls, newTarget, time, easing = TWEEN.Easing.Quadratic.Out) => {
  return new TWEEN.Tween(controls.target)
  .to(newTarget, time)
  .easing(easing)
  .onUpdate(() => {
    controls.update();
  });
};

export const controlsPositionTween = (controls, newPosition, time, easing = TWEEN.Easing.Quadratic.Out) => {
  return new TWEEN.Tween(controls.object.position)
  .to(newPosition, time)
  .easing(easing)
  .onUpdate(() => {
    controls.update();
  });
};

export const controlsLookAtTween = (controls, object, time, easing = TWEEN.Easing.Quadratic.Out) => {
  let info = controls.getClampInstanceInfo(object);
  
  return {
      first: controlsPositionTween(controls, info.position, time, easing),
      last: controlsTargetTween(controls, info.target, time, easing)
  };
};

export const deltaTimeTween = (onUpdate, time, easing = TWEEN.Easing.Quadratic.Out) => {
  return new TWEEN.Tween([0])
  .to([1], time)
  .easing(easing)
  .onUpdate(([dt]) => onUpdate(dt));
};
