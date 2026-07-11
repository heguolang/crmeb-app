/** 佣金记录 brokerageLevel 展示映射 */
export const BROKERAGE_LEVEL_SELF = 0;
export const BROKERAGE_LEVEL_ONE = 1;
export const BROKERAGE_LEVEL_TWO = 2;
export const BROKERAGE_LEVEL_TEAM_DIFF = 10;
export const BROKERAGE_LEVEL_TEAM_PEER = 11;

export function getBrokerageLevelLabel(level) {
  const map = {
    [BROKERAGE_LEVEL_SELF]: '自购',
    [BROKERAGE_LEVEL_ONE]: '一级',
    [BROKERAGE_LEVEL_TWO]: '二级',
    [BROKERAGE_LEVEL_TEAM_DIFF]: '团队极差',
    [BROKERAGE_LEVEL_TEAM_PEER]: '团队平级',
  };
  return map[level] || '';
}

export function getBrokerageLevelClass(level) {
  const map = {
    [BROKERAGE_LEVEL_SELF]: 'tag-self',
    [BROKERAGE_LEVEL_ONE]: 'tag-one',
    [BROKERAGE_LEVEL_TWO]: 'tag-two',
    [BROKERAGE_LEVEL_TEAM_DIFF]: 'tag-team-diff',
    [BROKERAGE_LEVEL_TEAM_PEER]: 'tag-team-peer',
  };
  return map[level] || '';
}
