import { assign, createMachine } from "xstate";

export const machine = createMachine(
  {
    id: "AppMachine",
    initial: "initial",
    context: {
      prompt: undefined,
      image: undefined,
      imageVariants: [],
      imageLibrary: [],
      imageEditConfig: {
        source: "http://localhost:3000/assets/Summit-AI-Graphic-test.png",
        mask: "http://localhost:3000/assets/Summit-AI-Graphic-test-mask.png",
      },
    },
    states: {
      initial: {
        on: {
          imageLibrary: {
            target: "imageLibrary",
          },
          imageService: {
            target: "imageService",
          },
          editImage: {
            target: "#imageService.editing",
          },
        },
      },
      imageLibrary: {
        id: "imageLibrary",
        on: {
          back: "initial",
          customizeImage: {
            target: "#imageService.customizing",
            actions: "setActiveImage",
          },
          deleteImage: { target: ".deletingImage" }
        },
        initial: "default",
        states: {
          default: {
            invoke: {
              src: "fetchImages",
              onDone: {
                actions: "storeImagesToLibrary"
              },
            },
          },
          deletingImage: {
            invoke: {
              src: "deleteImage",
              onDone: {
                target: "default",
                actions: "storeImagesToLibrary"
              },
              onError: {
                target: "default"
              }
            }
          }
        }
      },
      imageService: {
        id: "imageService",
        initial: "prompt",
        states: {
          prompt: {
            on: {
              next: {
                target: "generating",
              },
              back: {
                target: "#imageLibrary",
              }
            },
          },
          generating: {
            entry: ["storePrompt"],
            invoke: {
              src: "imageServiceGenerate",
              onDone: {
                target: "customizing",
                actions: "storeImages"
              },
              onError: {
                target: "error"
              }
            },
          },
          editing: {
            initial: "default",
            states: {
              default: {
                on: {
                  back: {
                    target: "#AppMachine"
                  },
                  createEdits: {
                    target: "creatingEdits"
                  },
                  storePrompt: {
                    actions: "storePrompt"
                  }
                }
              },
              creatingEdits: {
                invoke: {
                  src: "imageServiceCreateEdit",
                  onDone: {
                    target: "default",
                    actions: "storeEditImages"
                  },
                  onError: {
                    target: "default"
                  }
                }
              }
            }
          },
          customizing: {
            initial: "default",
            states: {
              default: {
                on: {
                  createPrompt: {
                    target: "#imageService.prompt",
                  },
                  createVariants: {
                    target: "choosingVariantAmount",
                  },
                  back: {
                    target: "#imageLibrary",
                  }
                },
              },
              choosingVariantAmount: {
                on: {
                  chooseVariantAmaount: {
                    target: "creatingVariants",
                    internal: false
                  },
                  back: {
                    target: 'default'
                  }
                }
              },
              creatingVariants: {
                on: {
                  back: {
                    target: "default"
                  }
                },
                invoke: {
                  src: "imageServiceCreateVariant",
                  onDone: {
                    target: "default",
                    actions: "storeVariants"
                  },
                  onError: {
                    target: "default"
                  }
                }
              },
            },
          },
          error: {}
        },
      },
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {
      storePrompt: assign({
        prompt: (_, event) => event.prompt
      }),
      storeImages: assign({
        image: (context, event) => event.data
      }),
      storeVariants: assign({
        imageVariants: (context, event) => [...context?.imageVariants ?? [], ...event.data]
      }),
      storeImagesToLibrary: assign({
        imageLibrary: (context, event) => event.data
      }),
      setActiveImage: assign({
        image: (context, event) => event.image,
        imageVariants: (context, event) => []
      }),
      storeEditImages: assign({
        imageVariants: (context, event) => [...context?.imageVariants ?? [], ...event.data]
      }),
    },
    services: {
      imageServiceGenerate: (context, event) => () => {
        return fetch('http://localhost:3000/images/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event)
        })
          .then(res => res.json())
      },
      imageServiceCreateVariant: (context, event) => () => {
        return fetch('http://localhost:3000/images/variant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: context.image.url, n: event?.amount ?? 1 })
        })
          .then(res => res.json())
      },
      fetchImages: (context, event) => () => {
        console.log(event)
        return fetch('http://localhost:3000/images', {
          headers: {
            'Content-Type': 'application/json',
          }
        })
          .then(res => res.json())
      },
      deleteImage: (context, event) => () => {
        console.log(event.image)
        return fetch('http://localhost:3000/images', {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: event.image })
        })
      },
      imageServiceCreateEdit: (context, event) => () => {
        console.log(context)
        return fetch('http://localhost:3000/images/edit', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: context.prompt, image: context.imageEditConfig.source, mask: context.imageEditConfig.mask, n: 3 })
        })
          .then(res => res.json())
      }
    },
    guards: {},
    delays: {},
  },
);
