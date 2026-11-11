# What does each accounting tool import?

## Recommendations

1. Match each tool's own sample import file column for column. Every manual fix seen in the interviews came from a column the tool did not expect.
2. Ship Xero first (most customers), then QuickBooks. Keep a plain spreadsheet for everyone else.
3. Do not build live sync this round. A file covers every tool today.

## Evidence

- Interviews with four bookkeepers, 6 to 9 Oct: month end took between 2 and 4 hours each, about 3 on average (estimated from their own account).
- Xero sales invoice import sample: 18 columns, dates as day/month/year.
- QuickBooks invoice import sample: 14 columns, one row per line item.

Sample content for the living-artifact example book.
