export const POSITION_STYLES = ["left", "right","both"];


export interface FlotingTOCSetting {
  ignoreHeaders:string;
  ignoreTopHeader: boolean;
  positionStyle: string;
  isLoadOnMobile:boolean;
  isLeft:boolean;
  isDefaultPin:boolean;
  isTooltip:boolean;
  defaultCollapsedLevel:number;
  expandAllSubheadings: boolean;
  isDefaultHide: boolean;
  enableHeadingNowrap: boolean;
  barStyle: string;
  enableBarHeadingText: boolean;
}

export const DEFAULT_SETTINGS: FlotingTOCSetting = {
  ignoreHeaders:'',
  ignoreTopHeader: false,
  positionStyle: "left",
  isLoadOnMobile: true,
  isLeft: false,
  isDefaultPin: false,
  isTooltip: true,
  defaultCollapsedLevel: 6,
  expandAllSubheadings: false,
  isDefaultHide: false,
  enableHeadingNowrap: true,
  barStyle: "enable-edge-style",
  enableBarHeadingText: false
};
