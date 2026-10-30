# Run ledger: Invoice Export

## Now

- Round 3, wave 2 building. Branch invoice-export-r3, draft PR #214.
- Head 4e1c9a2. Wave 1 merged at 9b03f11 after gate, two reviews and spot check.

## Rulings

- 28 Oct: csv-default kept (one row per invoice). Line items become a preset.
- 28 Oct: send-day changed to "a day the owner picks". schedule-settings gains one field, same wave.
- dialog-placement not opened. export-dialog-ui is blocked until it is answered. Asked in chat 29 Oct 14:10.

## Next step

1. Finish csv-mapping-presets and pdf-render-worker, run the wave 2 gate.
2. Unblock export-dialog-ui as soon as dialog-placement is answered.
3. Start wave 3 only after the gate and both reviews pass.
