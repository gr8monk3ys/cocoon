declare module "jest-axe" {
  export interface AxeViolation {
    id: string;
  }

  export interface AxeResult {
    violations: AxeViolation[];
  }

  export function axe(node: Element | Document | string): Promise<AxeResult>;
}
