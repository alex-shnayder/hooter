import { Effect, ExecutionMode } from 'corrie'
import { handler as corrieForkHandler } from 'corrie/src/effects/fork'
import { createRoutine, Mode as RoutineMode, Routine } from './routines'
import HooterBase, { Priority, HandlerProperties, Handler } from './HooterBase'
import { Event, Events, UserEvent } from './events'

interface TootEffect extends Effect {
  effect: 'toot'
  event: UserEvent | string
  args: any[]
}

interface HookEffect extends Effect {
  effect: 'hook'
  event: string | HandlerProperties<Events, string>
  priority?: Priority
  routineMode: RoutineMode
  fn?: Function
}

interface ForkEffect extends Effect {
  effect: 'fork'
  routine: Routine<any>
  mode: ExecutionMode
  args: any[]
}

interface HooterError extends Error {
  event?: 'string'
  [key: string]: any
}

function throwHandler(effect: Effect, execution: any): never {
  let err: HooterError = effect.err

  if (err instanceof Error && !err.event) {
    Object.defineProperty(err, 'event', {
      value: execution.context,
      enumerable: false,
    })
  }

  execution.status = 'completed'
  throw err
}

function tootHandler(effect: TootEffect, execution: any): any {
  let { event, args, cb } = effect
  let hooter = execution.routine.hooter as HooterBase<any>

  if (!hooter) {
    throw new Error('Routine hooter is undefined')
  }

  return hooter.tootGeneric(event, args, cb)
}

function toot(event: UserEvent | string, ...args: any[]): TootEffect {
  return { effect: 'toot', event, args }
}

function tootWith(
  event: UserEvent | string,
  cb: Function,
  ...args: any[]
): TootEffect {
  return { effect: 'toot', event, args, cb }
}

function hookHandler(
  effect: HookEffect,
  execution: any
): Handler<any, string> & Routine<any> {
  let { event, fn, routineMode, priority } = effect
  let hooter = execution.routine.hooter as HooterBase<any>

  if (!hooter) {
    throw new Error('Routine hooter is undefined')
  }

  return hooter.hookGeneric(routineMode, priority, event, fn)
}

function hook(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  let routineMode = fn ? RoutineMode.Default : RoutineMode.Result
  return {
    effect: 'hook',
    event,
    routineMode,
    fn,
  }
}

function hookStart(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  return {
    effect: 'hook',
    event,
    priority: Priority.Start,
    routineMode: RoutineMode.Default,
    fn,
  }
}

function hookEnd(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  return {
    effect: 'hook',
    event,
    priority: Priority.End,
    routineMode: RoutineMode.Default,
    fn,
  }
}

function preHook(event: string, fn: Function): HookEffect {
  return {
    effect: 'hook',
    event,
    routineMode: RoutineMode.Pre,
    fn,
  }
}

function preHookStart(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  return {
    effect: 'hook',
    event,
    priority: Priority.Start,
    routineMode: RoutineMode.Pre,
    fn,
  }
}

function preHookEnd(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  return {
    effect: 'hook',
    event,
    priority: Priority.End,
    routineMode: RoutineMode.Pre,
    fn,
  }
}

function postHook(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  return {
    effect: 'hook',
    event,
    routineMode: RoutineMode.Post,
    fn,
  }
}

function postHookStart(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  return {
    effect: 'hook',
    event,
    priority: Priority.Start,
    routineMode: RoutineMode.Post,
    fn,
  }
}

function postHookEnd(
  event: string | HandlerProperties<Events, string>,
  fn: Function
): HookEffect {
  return {
    effect: 'hook',
    event,
    priority: Priority.End,
    routineMode: RoutineMode.Post,
    fn,
  }
}

function forkHandler(effect: ForkEffect, execution: any) {
  let { routine, args, mode } = effect

  routine = createRoutine(
    execution.routine.hooter,
    RoutineMode.Default,
    routine
  )
  effect = { effect: 'fork', routine, args, mode }

  return corrieForkHandler(effect, execution)
}

export {
  TootEffect,
  HookEffect,
  ForkEffect,
  throwHandler,
  tootHandler,
  toot,
  tootWith,
  hookHandler,
  hook,
  hookStart,
  hookEnd,
  preHook,
  preHookStart,
  preHookEnd,
  postHook,
  postHookStart,
  postHookEnd,
  forkHandler,
}
