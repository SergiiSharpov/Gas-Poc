
export default {
  vertexSource:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentSource: `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    vec4 getTexture( sampler2D texelToLinearTexture ) {
        return mapTexelToLinear( texture2D( texelToLinearTexture , vUv ));
    }
    void main() {
        //gl_FragColor = getTexture( baseTexture );
        gl_FragColor = ( getTexture( baseTexture ) + vec4( 1.0 ) * getTexture( bloomTexture ) );
    }
  `,
  uniforms: {
    baseTexture: { value: null },
    bloomTexture: { value: null }
  }
}
