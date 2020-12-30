import React, { useState } from "react";
import { Matrix4, MeshPhysicalMaterial, Texture } from "three";

class ReflectorMaterialImpl extends MeshPhysicalMaterial {
  _tDiffuse;
  _textureMatrix;
  constructor(parameters = {}) {
    super(parameters);
    this.setValues(parameters);
    this._tDiffuse = { value: null };
    this._textureMatrix = { value: null };
  }

  onBeforeCompile(shader) {
    shader.uniforms.tDiffuse = this._tDiffuse;
    shader.uniforms.textureMatrix = this._textureMatrix;

    shader.vertexShader = `
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;
     
      ${shader.vertexShader}
    `;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
        #include <project_vertex>
	    my_vUv = textureMatrix * vec4( position, 1.0 );
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        `
    );

    shader.fragmentShader = `
        uniform sampler2D tDiffuse;
        varying vec4 my_vUv;

        float blendAdd(float base, float blend) {
            return min(base+blend,1.0);
        }

        vec3 blendAdd(vec3 base, vec3 blend) {
            return min(base+blend,vec3(1.0));
        }

        vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
            return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
        }
        ${shader.fragmentShader}
    `;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `
        #include <map_fragment>
        vec4 base = texture2DProj( tDiffuse, my_vUv );
        vec4 myTexelRoughness = texture2D( roughnessMap, vUv );
        base *= 1.0 - myTexelRoughness.r;
        diffuseColor.rgb += 0.1 * base.rgb; //blendAdd( base.rgb, diffuseColor.rgb, 0.0);
      `
    );
  }

  get tDiffuse() {
    return this._tDiffuse.value;
  }

  set tDiffuse(v) {
    this._tDiffuse.value = v;
  }
  get textureMatrix() {
    return this._textureMatrix.value;
  }

  set textureMatrix(v) {
    this._textureMatrix.value = v;
  }
}

export const ReflectorMaterial = React.forwardRef((props, ref) => {
  const [material] = useState(() => new ReflectorMaterialImpl());
  return <primitive object={material} ref={ref} attach="material" {...props} />;
});
