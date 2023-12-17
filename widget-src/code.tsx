// This widget will open an Iframe window with buttons to show a toast message and close the window.

const { widget } = figma
const { useEffect, Text, AutoLayout, useSyncedState, SVG, Image, Rectangle, Line, Span, Input, usePropertyMenu } = widget
import { download, member, plus, star, star_fill } from "./icons"
import { Review, Review as ReviewProps, Sort, } from "./types"
import _, { set } from "lodash"
import { translation } from "./translation";
import { Menu, Button, MenuTrigger, MenuList, MenuItem, colors } from 'fidget-ui'
import { IconArrowDownTray, IconEye, IconEyeSlash, IconPlus, IconUser } from 'fidget-ui/icons'

const BAR_LENGTH = 320;

function Rate({ rate }: { rate: number }) {
  return <AutoLayout>
    {
      [1, 2, 3, 4, 5].map(num => <SVG src={num <= rate ? star_fill : star} key={num} width={12} height={12} />)
    }
  </AutoLayout>
}

function Review({ user, text, rate, timestamp, id, edited, anonymous, lang }: ReviewProps & { lang: string }) {
  const d = new Date(timestamp);
  const date = d.toLocaleDateString(lang);
  const time = d.toLocaleTimeString();

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
      if (user.id === figma.currentUser?.id) {
        figma.showUI(__html__);
        figma.ui.postMessage({ type: "CHANGE_VIEW", payload: "EDIT_REVIEW", review: { text, rate, id, anonymous } })
      } else {
        return figma.closePlugin()
      }
    })}
  >
    <AutoLayout name="User Info" verticalAlignItems="center" spacing={12}>
      {avatar}
      <AutoLayout name="Col" direction="vertical">
        <Text name="Username" fontWeight={"bold"}>{anonymous ? translation["anonymousUser"][lang] : user.name}</Text>
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
        {edited ? <Span fill={"#777"}>({translation['edited'][lang]}) </Span> : null}
        {text}
      </Text>
    </AutoLayout>
  </AutoLayout>
}

function Widget() {
  const [reviews, setReviews] = useSyncedState<ReviewProps[]>("reviews", []);
  const [title, setTitle] = useSyncedState<string>("title", "");
  const [displayTitle, setDisplayTitle] = useSyncedState<boolean>("display-title", true);
  const [sortBy, setSortBy] = useSyncedState<Sort>("sort-by", "DESCENDING_BY_TIME");
  const [lang, setLang] = useSyncedState<string>("lang", "en-US");
  const [locked, setLocked] = useSyncedState<boolean>("locked", false);
  const [hidden, setHidden] = useSyncedState<boolean>("hidden", false);
  const [hiddenBy, setHiddenBy] = useSyncedState<User | null>("hidden-by", null);

  usePropertyMenu(
    [
      {
        propertyName: "display-title",
        itemType: "toggle",
        tooltip: translation["display"][lang],
        isToggled: displayTitle
      },
      {
        propertyName: "language", itemType: "dropdown", tooltip: translation["lang"][lang],
        options: [
          { option: "en-US", label: "English" },
          { option: "zh-CN", label: "简体中文" },
        ], selectedOption: lang
      }
    ],
    (e) => {
      if (e.propertyName === "display-title") {
        setDisplayTitle(prev => !prev)
      } else if (e.propertyName === "language") {
        setLang(e.propertyValue || "zh-CN")
      }
    }
  )

  const sum = reviews.length > 0 ? reviews.map(({ rate }) => rate).reduce((a, b) => a + b) : 0;
  const avg = reviews.length > 0 ? sum / reviews.length : 0;

  const sortReviews = (reviews: Review[], { sort }: { sort: Sort }) => {
    switch (sort) {
      case "ASCENDING_BY_RATE":
        return _.sortBy(reviews, d => d.rate)
      case "DESCENDING_BY_RATE":
        return _.sortBy(reviews, d => d.rate).reverse()
      case "ASCENDING_BY_TIME":
        return _.sortBy(reviews, d => d.timestamp)
      case "DESCENDING_BY_TIME":
        return _.sortBy(reviews, d => d.timestamp).reverse()
      default:
        return reviews
    }
  }

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

  const hideReviews = ({ exposable = "EVERYONE" }: { exposable: "EVERYONE" | "INITIATOR" }) => {
    if (exposable === "EVERYONE") {
      setHidden(true)
      setHiddenBy(null)
    } else if (exposable === "INITIATOR") {
      setHidden(true)
      figma.currentUser && setHiddenBy(figma.currentUser)
    }
  }

  const showReviews = () => {
    if (hiddenBy) {
      if (figma.currentUser?.id === hiddenBy.id) {
        setHidden(false)
      } else {
        figma.notify(translation['expose_not_allowed'][lang] + " " + hiddenBy.name + ".");
      }
    } else {
      setHidden(false)
    }
  }

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
        if (hidden) {
          figma.notify(translation['comment_when_hidden'][lang])
        }
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
    <AutoLayout overflow="visible" name="Review" direction="vertical" padding={24} fill={"#fff"} spacing={12} width={"hug-contents"} cornerRadius={24}>
      {displayTitle ?
        <Input
          name="Title Input" value={title} width={"fill-parent"} onTextEditEnd={(e) => setTitle(e.characters)} placeholder={translation["title"][lang]} fontSize={32} lineHeight={48} fill={"#333"} inputFrameProps={{ name: "Input Container" }} /> : null}
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

      <AutoLayout name="Review List" direction="vertical" spacing={8} width={"fill-parent"} overflow={"visible"}>
        <AutoLayout name="Flex" width={"fill-parent"} verticalAlignItems={"center"} padding={{ left: 12 }} overflow={"visible"}>

          <AutoLayout width={"fill-parent"} spacing={4} verticalAlignItems={"center"} overflow={"visible"}>
            {reviews.length > 0 ? <Text fontWeight={"bold"}>{translation["all"][lang]} ({reviews.length})</Text> : <Text name="Empty" fill={"#777"} width={"fill-parent"}>{translation["click"][lang]}</Text>}
            {/* <Sorter value={sortBy} onChange={(value: Sort) => setSortBy(value)} /> */}
          </AutoLayout>

          <Button variant="ghost" size="sm" colorScheme="blue" onClick={openAddReviewView} leftIcon={<IconPlus />}>{translation["add"][lang]}</Button>

        </AutoLayout>
        {
          !hidden ?
            sortReviews(reviews, { sort: sortBy }).map((review, index) => <Review {...review} key={index} lang={lang} />) :
            <AutoLayout width={'fill-parent'} padding={{ horizontal: 12 }}>
              <AutoLayout
                width={"fill-parent"}
                fill={colors.neutral[50]}
                height={120}
                stroke={colors.neutral[200]}
                cornerRadius={8}
                strokeDashPattern={[4, 4]}
                verticalAlignItems="center"
                horizontalAlignItems={"center"}
                direction="vertical"
                spacing={8}
              >
                <IconEyeSlash color={colors.neutral[500]} />
                {hiddenBy ?
                  <Text fontSize={11} fill={colors.neutral[500]}>
                    {translation['hidden_by'][lang]} {hiddenBy?.name || ''}.
                  </Text>
                  : <Text fontSize={11} fill={colors.neutral[500]}>
                    {translation['hidden'][lang]}
                  </Text>}

                <Button variant="ghost" size="sm" colorScheme="blue" onClick={() => showReviews()}>
                  {translation["expose"][lang]}
                </Button>
              </AutoLayout>
            </AutoLayout>
        }
      </AutoLayout>

      {
        (reviews.length > 0 && !hidden)
          ? <AutoLayout overflow="visible" horizontalAlignItems={"end"} width={"fill-parent"}>
            <AutoLayout overflow="visible">
              <Button name="Button" variant="ghost" onClick={exportReviews} size="sm" leftIcon={<IconArrowDownTray strokeWidth={1} />}>
                {translation["download"][lang]}
              </Button>
              <Menu id="visibility" placement="bottom-end">
                <MenuTrigger>
                  <Button variant="ghost" size="sm" leftIcon={<IconEyeSlash />}>
                    {translation["hide"][lang]}
                  </Button>
                </MenuTrigger>
                <MenuList width={96}>
                  <MenuItem fontSize={11} onClick={() => hideReviews({ exposable: "INITIATOR" })}>
                    {translation["initiator_expose"][lang]}
                  </MenuItem>
                  <MenuItem fontSize={11} onClick={() => hideReviews({ exposable: "EVERYONE" })}>
                    {translation["everyone_expose"][lang]}
                  </MenuItem>
                </MenuList>
              </Menu>
            </AutoLayout>
          </AutoLayout>
          : null
      }
    </AutoLayout>
  )
}

widget.register(Widget)
