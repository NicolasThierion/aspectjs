import { Around, Aspect, BeforeContext, JoinPoint, on } from '@aspectjs/core';
import Toastify from 'toastify-js';
import { Toasted } from '../annotations/toasted.annotation';

@Aspect()
export class ToastedAspect {
  toastedConsole = new ToastingConsole();
  @Around(
    // on.classes.withAnnotations(Toasted),
    on.methods.withAnnotations(Toasted)
  )
  toastLogs(ctxt: BeforeContext, jp: JoinPoint, jpArgs: unknown[]) {
    this.toastedConsole.replace();
    try {
      return jp(...jpArgs);
    } catch (e) {
      console.error(e);
    } finally {
      this.toastedConsole.restore();
    }
  }
}

class ToastingConsole {
  originalConsole = console;

  private showToast(
    className: string,
    color1: string,
    color2: string,
    args: unknown[]
  ) {
    Toastify({
      text: args.join(', '),
      className,
      style: {
        background: `linear-gradient(to right, ${color1}, ${color2})`,
      },
    }).showToast();
  }
  log(...args: any) {
    this.originalConsole.log(...args);
    this.showToast('log', '#0057b0', '#3d8dc9', args);
  }

  info(...args: any) {
    this.originalConsole.info(...args);
    this.showToast('log', '#00b09b', '#96c93d', args);
  }

  error(...args: any) {
    this.originalConsole.error(...args);
    this.showToast('error', '#b04a00', '#c9a93d', args);
  }

  warn(...args: any) {
    this.originalConsole.warn(...args);
    this.showToast('error', '#b04a00', '#c9a93d', args);
  }

  /**
   * Replaces console logs by toasts
   */
  replace() {
    console = this as any;
  }

  /**
   * restore console state
   */
  restore() {
    console = this.originalConsole;
  }
}
