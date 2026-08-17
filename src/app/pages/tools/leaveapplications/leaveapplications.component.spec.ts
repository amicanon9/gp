import { calculateLeaveHours } from './leaveapplications.component';

describe('calculateLeaveHours', () => {
  it('should return 8 hours for a single workday when the leave span is one day', () => {
    const start = new Date(2024, 6, 30, 8, 30);
    const end = new Date(2024, 6, 30, 17, 30);

    expect(calculateLeaveHours(start, end, new Set())).toBe(8);
  });

  it('should skip holidays and weekends', () => {
    const start = new Date(2024, 6, 30, 8, 30);
    const end = new Date(2024, 7, 1, 17, 30);
    const holidays = new Set([new Date(2024, 7, 1).toDateString()]);

    expect(calculateLeaveHours(start, end, holidays)).toBe(8);
  });
});
