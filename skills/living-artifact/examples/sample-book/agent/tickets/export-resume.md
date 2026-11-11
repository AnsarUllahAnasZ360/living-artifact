# export-resume: a stopped export goes on where it stopped

Owner: builder of PR export-jobs. Risk: high.

## Where it was found

- apps/api/src/jobs/export.ts: the job writes the whole file at the end, so a restart starts again from zero.

## Approach

Read invoices in pages of 500. After each page, write the page number to the job's record in the same transaction as the rows. A new worker reads the last page number and continues.

## Proof

- Kill test: stop the worker at page 7 of 12; the file has every invoice once.
- Screenshot: agent/proof/export-job-runner-1.png (the record row after a resumed run).

Sample content for the living-artifact example book.
