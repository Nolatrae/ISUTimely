/* eslint-disable prettier/prettier */
export const extractWeek = (weekString: string): number => {
  const match = weekString.match(/ТО:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};
