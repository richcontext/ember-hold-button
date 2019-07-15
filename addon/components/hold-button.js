import { later, cancel } from '@ember/runloop';
import { htmlSafe } from '@ember/template';
import { computed } from '@ember/object';
import Component from '@ember/component';
import layout from '../templates/components/hold-button';

var positionalParams = {
  positionalParams: 'params'
};

var HoldButtonComponent = Component.extend(positionalParams, {
  layout: layout,
  tagName: 'button',
  classNames: ['ember-hold-button'],
  classNameBindings: ['isHolding', 'isComplete', 'type'],
  attributeBindings: ['style'],

  delay: 500,
  type: '',

  timer: null,
  isHolding: false,
  isComplete: false,

  style: computed('delay', function() {
    let delay = this.get('delay');

    let durations = [
      '-webkit-transition-duration',
      '-moz-transition-duration',
      'transition-duration',
      '-webkit-animation-duration',
      '-moz-animation-duration',
      'animation-duration'
    ]
      .map(property => {
        return property + ': ' + delay + 'ms';
      })
      .join(';');

    return htmlSafe(durations);
  }),

  willInsertElement() {
    this.registerHandler();
  },

  killContextMenu() {
    const e = event || window.event;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
  },

  registerHandler() {
    var el = this.element;
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('spellcheck', 'false');
    this.on('touchStart', this, this.startTouchTimer);
    this.on('mouseDown', this, this.startTimer);
  },

  startTouchTimer(e) {
    e.stopPropagation();
    e.preventDefault()
    this.startTimer();
  },

  startTimer() {
    if (!this.get('timer')) {
      this.set('isComplete', false);
      this.set('isHolding', true);
      this.on('contextMenu', this.killContextMenu);
      this.off('mouseDown', this, this.startTimer);
      this.off('touchStart', this, this.startTouchTimer);

      this.on('mouseUp', this, this.cancelTimer);
      this.on('mouseLeave', this, this.cancelTimer);
      this.on('touchEnd', this, this.cancelTimer);
      this.on('touchCancel', this, this.cancelTimer);

      let timer = later(this, this.timerFinished, this.get('delay'));
      this.set('timer', timer);
    }
  },

  cancelTimer() {
    const params = this.getWithDefault('params', []);
    const actionParams = ['release', ...params];
    // eslint-disable-next-line
    this.sendAction(...actionParams);
    this.set('isHolding', false);
    cancel(this.get('timer'));
    this.set('timer', null);
    this.off('contextMenu', this.killContextMenu);
    this.off('mouseUp', this, this.cancelTimer);
    this.off('mouseLeave', this, this.cancelTimer);
    this.off('touchEnd', this, this.cancelTimer);
    this.off('touchCancel', this, this.cancelTimer);
    this.registerHandler();
  },

  timerFinished() {
    if (this.get('isHolding') && !this.get('isComplete')) {
      const params = this.getWithDefault('params', []);
      const actionParams = ['action', ...params];
      // eslint-disable-next-line
      this.sendAction(...actionParams);
      this.set('isComplete', true);
      this.registerHandler();
    }
  }
});

HoldButtonComponent.reopenClass(positionalParams);
export default HoldButtonComponent;
