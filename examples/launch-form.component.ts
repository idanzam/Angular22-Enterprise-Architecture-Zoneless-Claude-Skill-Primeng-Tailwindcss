/**
 * Mission Control — launch scheduling form.
 * Demonstrates: stable Signal Forms (v22) with PrimeNG 22 components,
 * cross-field validation, conditional fields, async name check with debounce,
 * [formField] binding + `invalid` styling + p-invalid: Tailwind variants.
 */
import { Component, signal, inject } from '@angular/core';
import {
  form, FormField, submit, schema,
  required, email, minLength, min, minDate,
  validate, validateHttp, hidden, applyWhen,
} from '@angular/forms/signals';

import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LaunchStore } from './launch-store.service';

interface LaunchRequest {
  mission: string;
  pad: string | null;
  contactEmail: string;
  crewCount: number;
  windowStart: Date | null;
  hasPayload: boolean;
  payloadMassKg: number;
}

@Component({
  selector: 'app-launch-form',
  imports: [FormField, Button, Card, DatePicker, InputNumber, InputText, Message, Select, ToggleSwitch],
  templateUrl: './launch-form.html',
})
export class LaunchForm {
  private readonly store = inject(LaunchStore);

  protected readonly pads = this.store.pads; // httpResource<Pad[]> exposed by the store

  protected readonly model = signal<LaunchRequest>({
    mission: '', pad: null, contactEmail: '',
    crewCount: 0, windowStart: null,
    hasPayload: false, payloadMassKg: 0,
  });

  protected readonly launchForm = form(this.model, s => {
    required(s.mission, { message: 'Mission name is required' });
    minLength(s.mission, 3, { message: 'At least 3 characters' });
    // async availability check, debounced server-side validation (v22)
    validateHttp(s.mission, {
      request: ({ value }) => `/api/missions/available?name=${encodeURIComponent(value())}`,
      errors: (free: boolean) => free ? undefined : { kind: 'taken', message: 'Name already in use' },
      debounce: 400,
    });

    required(s.pad, { message: 'Select a launch pad' });
    required(s.contactEmail);
    email(s.contactEmail, { message: 'Enter a valid email' });

    min(s.crewCount, 0);
    required(s.windowStart, { message: 'Pick a launch window' });
    minDate(s.windowStart, new Date(), { message: 'Window must be in the future' }); // v22 validator

    // Conditional structure: payload mass only exists when hasPayload is on
    hidden(s.payloadMassKg, ({ valueOf }) => !valueOf(s.hasPayload));
    applyWhen(s, ({ value }) => value().hasPayload, sub => {
      min(sub.payloadMassKg, 0.1, { message: 'Payload mass is required' });
    });

    // Cross-field rule: crewed + heavy payload exceeds vehicle envelope
    validate(s.crewCount, ({ value, valueOf }) =>
      value() > 3 && valueOf(s.payloadMassKg) > 20_000
        ? { kind: 'envelope', message: 'Crew of 4+ with >20t payload exceeds vehicle limits' }
        : undefined);
  });

  protected async schedule(): Promise<void> {
    await submit(this.launchForm, async () => {
      const ok = await this.store.schedule(this.model());
      if (!ok) throw new Error('Scheduling failed — try another window');
    });
  }
}
