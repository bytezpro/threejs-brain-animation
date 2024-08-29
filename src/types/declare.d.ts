declare module "*.glsl" {
  const value: string;
  export default value;
}

declare module "three-instanced-uniforms-mesh" {
  import { InstancedMesh, BufferGeometry, Material } from "three";

  export class InstancedUniformsMesh extends InstancedMesh {
    constructor(geometry: BufferGeometry, material: Material, count: number);
    setUniformAt(name: string, index: number, value: any): void;
  }
}
