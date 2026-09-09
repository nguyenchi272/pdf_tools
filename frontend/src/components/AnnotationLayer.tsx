import type { Annotation } from '../types/annotation'


interface AnnotationLayerProps {
  pageNumber: number
  annotations: Annotation[]
  scale: number
}


export default function AnnotationLayer({
  pageNumber,
  annotations,
  scale,
}: AnnotationLayerProps) {

  const pageAnnotations =
    annotations.filter(
      (annotation) =>
        annotation.page === pageNumber,
    )


  return (
    <div
      className="annotation-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >

      {pageAnnotations.map((annotation) => (

        annotation.rects.map((rect, index) => {

          const left = rect.x * scale
          const top = rect.y * scale
          const width = rect.width * scale
          const height = rect.height * scale


          return (
            <div
              key={`${annotation.id}-${index}`}
              className={
                `annotation annotation-${annotation.type}`
              }
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
              }}
            />
          )
        })

      ))}

    </div>
  )
}