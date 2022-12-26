// This widget will open an Iframe window with buttons to show a toast message and close the window.

const { widget } = figma
const { useEffect, Text, AutoLayout, useSyncedState, SVG, Image, Rectangle, Line, Span, Input, usePropertyMenu, Frame } = widget
import { download, member, plus, star, star_fill } from "./icons"
import { Review as ReviewProps } from "./types"

const BAR_LENGTH = 320;

function Rate({ rate }: { rate: number }) {
  return <AutoLayout>
    {
      [1, 2, 3, 4, 5].map(num => <SVG src={num <= rate ? star_fill : star} key={num} width={12} height={12} />)
    }
  </AutoLayout>
}

function Review({ user, text, rate, timestamp, id, edited, anonymous }: ReviewProps) {
  const d = new Date(timestamp);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString()

  const avatar = anonymous ?
    <AutoLayout name="Anonymous Avatar" width={32} height={32} fill={"#777"} verticalAlignItems={"center"} horizontalAlignItems={"center"} cornerRadius={100}>
      <SVG src={member} />
    </AutoLayout>
    : <Image name="Avatar" src={user.photoUrl || ""} width={32} height={32} cornerRadius={100} />

  return <AutoLayout
    name="Review"
    width={"fill-parent"}
    direction="vertical" fill={"#fff"} padding={{ vertical: 12, horizontal: 12 }} spacing={8} cornerRadius={6}
    hoverStyle={{ fill: "#eeeeee" }}
    onClick={() => new Promise(() => {
      figma.showUI(__html__);
      if (user.id === figma.currentUser?.id) {
        figma.ui.postMessage({ type: "CHANGE_VIEW", payload: "EDIT_REVIEW", review: { text, rate, id, anonymous } })
      }
    })}
  >
    <AutoLayout name="User Info" verticalAlignItems="center" spacing={12}>
      {avatar}
      <AutoLayout name="Col" direction="vertical">
        <Text name="Username" fontWeight={"bold"}>{anonymous ? "Anonymous User" : user.name}</Text>
        <AutoLayout name="Row" verticalAlignItems="center" spacing={4}>
          <Rate rate={rate} />
          <Text fontSize={12} fill={"#777"}>
            {date} {time}
          </Text>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>

    <AutoLayout name="Content" padding={{ left: 44 }} width={"fill-parent"}>
      <Text name="Text" width={"fill-parent"}>
        {edited ? <Span fill={"#777"}>(Edited) </Span> : null}
        {text}
      </Text>
    </AutoLayout>
  </AutoLayout>
}

function Widget() {
  const [reviews, setReviews] = useSyncedState<ReviewProps[]>("reviews", []);
  const [title, setTitle] = useSyncedState<string>("title", "");
  const [displayTitle, setDisplayTitle] = useSyncedState<boolean>("display-title", true);

  usePropertyMenu(
    [{ propertyName: "display-title", itemType: "toggle", tooltip: "Display Title", isToggled: displayTitle }],
    (e) => {
      if (e.propertyName === "display-title") {
        setDisplayTitle(prev => !prev)
      }
    }
  )

  const sum = reviews.length > 0 ? reviews.map(({ rate }) => rate).reduce((a, b) => a + b) : 0;
  const avg = reviews.length > 0 ? sum / reviews.length : 0;

  const addReview = (text: string, rate: number, anonymous: boolean) => {
    const currentUser = figma.currentUser;
    if (currentUser) {
      setReviews(prev => [{
        id: Math.random().toString(16).slice(2),
        user: currentUser,
        text,
        rate,
        edited: false,
        timestamp: new Date().getTime(),
        anonymous
      }, ...prev])
    }
  }

  const openUI = ({ visible }: { visible: boolean }) => new Promise(() => {
    return figma.showUI(__html__, { visible })
  })

  const openAddReviewView = () => new Promise(() => {
    openUI({ visible: true });
    figma.ui.postMessage({ type: "CHANGE_VIEW", payload: "ADD_REVIEW" })
  })

  const exportReviews = () => new Promise(() => {
    figma.showUI(__html__, { visible: false })
    figma.ui.postMessage({
      type: "DOWNLOAD_DATA",
      payload: reviews.map(
        review => {
          if (review.anonymous) {
            return { ...review, user: {} }
          } else {
            return review
          }
        }
      )
    })
  })

  useEffect(() => {
    figma.ui.onmessage = (msg) => {
      console.log(msg)
      if (msg.type === 'ADD_REVIEW') {
        const { rate, text, anonymous } = msg.payload
        addReview(text, rate, anonymous);
        figma.closePlugin();

      } else if (msg.type === 'DELETE_REVIEW') {
        const newReviews = [...reviews].filter(reivew => reivew.id !== msg.payload.id);
        console.log(newReviews)
        setReviews(newReviews)
        figma.closePlugin();
      } else if (msg.type === 'EDIT_REVIEW') {
        const newReviews = [...reviews];
        const index = reviews.findIndex(review => review.id === msg.payload.id);
        const review = reviews[index];
        newReviews.splice(index, 1, { ...review, text: msg.payload.text, rate: msg.payload.rate, edited: true, anonymous: msg.payload.anonymous })
        setReviews(newReviews)
        figma.closePlugin()
      }
    }
  })

  return (
    <AutoLayout name="Review" direction="vertical" padding={24} fill={"#fff"} spacing={12} width={"hug-contents"} cornerRadius={24}>
      {displayTitle ?
        <Input name="Title Input" value={title} width={"fill-parent"} onTextEditEnd={(e) => setTitle(e.characters)} placeholder={"Add Title..."} fontSize={32} lineHeight={48} fill={"#333"} inputFrameProps={{ name: "Input Container" }} /> : null}
      {/* <Rate /> */}
      <AutoLayout name="Overview" width={"hug-contents"} spacing={24}>
        <AutoLayout name="Overall Band" verticalAlignItems="center" spacing={4} fill={"#fff"} padding={8} width={"hug-contents"}>
          <Text italic fontWeight={"bold"} fontSize={48}>
            {avg.toFixed(1)}
          </Text>
          <SVG src={star_fill} width={32} height={32} />
        </AutoLayout>

        <AutoLayout name="Percentage" width={"hug-contents"} direction={"vertical"}>
          {
            [1, 2, 3, 4, 5].reverse().map(num => {
              const percentage = reviews.length > 0 ? reviews.filter(review => review.rate === num).length / reviews.length : 0;
              const length = reviews.length > 0 ? (reviews.filter(review => review.rate === num).length / reviews.length) * BAR_LENGTH : 1

              return (
                <AutoLayout name={`Percentage/${num}`} key={num} verticalAlignItems={"center"} spacing={8} width={"hug-contents"}>
                  <Text name="Mark" fill={"#777"} fontSize={12} width={12} >{num}</Text>
                  <AutoLayout name="Container" width={BAR_LENGTH} height={8} fill={"#eee"} cornerRadius={2}>
                    <Rectangle name="Bar" fill={"#FFC531"} height={"fill-parent"} width={length || 1} />
                  </AutoLayout>
                  <Text fontSize={10} fill={"#aaa"} italic>{(percentage * 100).toFixed(1)}%</Text>
                </AutoLayout>
              )
            })
          }
        </AutoLayout>
      </AutoLayout>

      <Line name="Divider" stroke={"#ccc"} length={"fill-parent"} />

      <AutoLayout name="Review List" direction="vertical" spacing={8} width={"fill-parent"}>
        <AutoLayout name="Flex" width={"fill-parent"} verticalAlignItems={"center"} padding={{ left: 12 }}>
          {reviews.length > 0 ? <Text width={"fill-parent"} fontWeight={"bold"}>All reviews ({reviews.length})</Text> : <Text name="Empty" fill={"#777"} width={"fill-parent"}>Click the button to add a review.</Text>}

          <AutoLayout
            name="Button"
            // width={28}
            height={28}
            cornerRadius={6}
            horizontalAlignItems={"center"}
            verticalAlignItems={"center"}
            padding={{ vertical: 12, horizontal: 8 }}
            onClick={openAddReviewView}
            hoverStyle={{ fill: "#eee" }}
            spacing={4}
          >
            <SVG src={plus} width={14} height={14} />
            <Text fontSize={12}>Add Review</Text>
          </AutoLayout>
        </AutoLayout>
        {reviews.map((review, index) => <Review {...review} key={index} />)}
      </AutoLayout>

      {
        reviews.length > 0
          ? <AutoLayout horizontalAlignItems={"end"} width={"fill-parent"}>
            <AutoLayout
              name="Button"
              height={28}
              cornerRadius={6}
              horizontalAlignItems={"center"}
              verticalAlignItems={"center"}
              padding={{ vertical: 12, horizontal: 8 }}
              hoverStyle={{ fill: "#eee" }}
              spacing={4}
              onClick={exportReviews}
            >
              <SVG src={download} width={14} height={14} />
              <Text fontSize={12} fill={"#777"}>Download data</Text>
            </AutoLayout>
          </AutoLayout>
          : null
      }
    </AutoLayout>
  )
}

widget.register(Widget)
