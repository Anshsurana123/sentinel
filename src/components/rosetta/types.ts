export interface RosettaComponent {
  symbol: string;
  meaning: string;
  unit: string;
  calculus_role: string;
}

export interface RosettaGraphConfig {
  type: "position_time" | "velocity_time" | "force_displacement" | "oscillation" | string;
  x_label: string;
  y_label: string;
  equation_js: string;
}

export interface ParsedRosettaResponse {
  physics_form: string;
  calculus_form: string;
  components: RosettaComponent[];
  graph_config: RosettaGraphConfig;
  simulation_type: "pendulum" | "spring" | "projectile" | "none";
  plain_english: string;
}
