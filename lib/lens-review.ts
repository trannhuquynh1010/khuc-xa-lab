// Question bank for the lens lesson. Same shape as the optics bank so the tutor
// engine can drive either lesson. Answer keys live here, so only server modules
// may import this file.
import { type AiBankQuestion } from "./optics-ai-types";

export type LensQuestion = AiBankQuestion;

// Matched pre/post pairs. They probe the same idea with different wording so the
// teacher can compare reasoning before and after practice. They are deliberately
// NOT a validated equivalent test.
export const lensDiagnosticIds = ["lens-pre-type", "lens-pre-focal", "lens-pre-rays", "lens-pre-image"];
export const lensTransferIds = ["lens-post-type", "lens-post-focal", "lens-post-rays", "lens-post-image"];

const anchors: LensQuestion[] = [
  {
    id: "lens-pre-type", topic: "lens-type", difficulty: 2, kind: "single",
    prompt: "Hai thấu kính A và B cùng được chiếu một chùm sáng song song với trục chính. Sau thấu kính A chùm sáng tụ lại một điểm; sau thấu kính B chùm sáng loe rộng ra. Từ đó có thể kết luận gì?",
    choices: [
      { value: "thickness", label: "Chưa kết luận được, vì còn phải biết thấu kính dày hay mỏng" },
      { value: "behaviour", label: "A là thấu kính hội tụ, B là thấu kính phân kì" },
      { value: "reverse", label: "A là thấu kính phân kì, B là thấu kính hội tụ" },
      { value: "same", label: "Cả hai đều là thấu kính hội tụ, chỉ khác tiêu cự" },
    ],
    answers: ["behaviour"],
    explanation: "Thấu kính được phân loại theo tác dụng với chùm tia song song: hội tụ thì làm chùm tia tụ lại, phân kì thì làm chùm tia loe ra. Đây là dấu hiệu nhận biết chắc chắn, không cần biết độ dày.",
  },
  {
    id: "lens-post-type", topic: "lens-type", difficulty: 2, kind: "single",
    prompt: "Một thấu kính có phần giữa mỏng hơn phần rìa, được chiếu vào một chùm sáng song song với trục chính. Chùm sáng sau thấu kính sẽ thế nào và vì sao?",
    choices: [
      { value: "converge", label: "Tụ lại tại tiêu điểm, vì mọi thấu kính đều làm sáng tụ lại" },
      { value: "diverge", label: "Loe rộng ra, vì thấu kính mép dày là thấu kính phân kì" },
      { value: "straight", label: "Truyền thẳng, vì chùm tia đã song song với trục chính" },
    ],
    answers: ["diverge"],
    explanation: "Thấu kính có phần giữa mỏng hơn phần rìa (mép dày) là thấu kính phân kì. Chùm tia song song với trục chính sau khi qua nó sẽ loe rộng ra, đường kéo dài của các tia khúc xạ cắt nhau tại tiêu điểm nằm trước thấu kính.",
  },
  {
    id: "lens-pre-focal", topic: "focal", difficulty: 2, kind: "single",
    prompt: "Tiêu cự của một thấu kính hội tụ là f = 12 cm. Điều đó có nghĩa gì?",
    choices: [
      { value: "distance", label: "Khoảng cách từ quang tâm đến tiêu điểm bằng 12 cm" },
      { value: "object", label: "Vật phải đặt cách thấu kính đúng 12 cm mới tạo được ảnh" },
      { value: "thickness", label: "Thấu kính dày 12 cm ở phần giữa" },
      { value: "image", label: "Ảnh luôn hiện cách thấu kính 12 cm" },
    ],
    answers: ["distance"],
    explanation: "Tiêu cự f là khoảng cách từ quang tâm O đến tiêu điểm của thấu kính. Nó là đặc trưng của riêng thấu kính, không phụ thuộc vào việc đặt vật ở đâu.",
  },
  {
    id: "lens-post-focal", topic: "focal", difficulty: 2, kind: "single",
    prompt: "Một thấu kính hội tụ có tiêu cự 10 cm. Người ta lần lượt đặt vật cách thấu kính 30 cm rồi 15 cm. Khi đổi vị trí vật như vậy, tiêu cự của thấu kính thay đổi thế nào?",
    choices: [
      { value: "changes", label: "Giảm đi, vì vật lại gần thấu kính hơn" },
      { value: "constant", label: "Không đổi, vì tiêu cự là đặc trưng của thấu kính" },
      { value: "doubles", label: "Thay đổi theo vị trí ảnh" },
    ],
    answers: ["constant"],
    explanation: "Tiêu cự chỉ phụ thuộc vào bản thân thấu kính. Khi dịch vật, vị trí và tính chất ảnh thay đổi, nhưng tiêu điểm và tiêu cự vẫn giữ nguyên.",
  },
  {
    id: "lens-pre-rays", topic: "rays", difficulty: 2, kind: "multiple",
    prompt: "Với thấu kính hội tụ, chọn các phát biểu đúng về đường truyền của các tia sáng đặc biệt.",
    choices: [
      { value: "centre", label: "Tia tới đi qua quang tâm O thì truyền thẳng, không bị đổi hướng" },
      { value: "parallel", label: "Tia tới song song với trục chính thì tia khúc xạ đi qua tiêu điểm" },
      { value: "focus", label: "Tia tới đi qua tiêu điểm thì tia khúc xạ song song với trục chính" },
      { value: "allbend", label: "Mọi tia tới đều bị lệch, kể cả tia đi qua quang tâm" },
    ],
    answers: ["centre", "parallel", "focus"],
    explanation: "Ba tia đặc biệt của thấu kính hội tụ: tia qua quang tâm truyền thẳng; tia song song trục chính cho tia khúc xạ qua tiêu điểm; tia qua tiêu điểm cho tia khúc xạ song song trục chính. Tia qua quang tâm là ngoại lệ, không bị đổi hướng.",
  },
  {
    id: "lens-post-rays", topic: "rays", difficulty: 2, kind: "single",
    prompt: "Để dựng ảnh của một vật qua thấu kính hội tụ, bạn Nam chỉ vẽ duy nhất tia đi qua quang tâm O. Vì sao cách làm đó chưa xác định được ảnh?",
    choices: [
      { value: "wrongray", label: "Vì tia qua quang tâm không phải tia đặc biệt" },
      { value: "needtwo", label: "Vì cần ít nhất hai tia; ảnh nằm ở giao điểm của chúng" },
      { value: "mustfocus", label: "Vì bắt buộc phải dùng tia đi qua tiêu điểm" },
    ],
    answers: ["needtwo"],
    explanation: "Một tia sáng chỉ cho một đường thẳng, chưa định được điểm. Phải vẽ ít nhất hai tia đặc biệt; ảnh của điểm sáng nằm tại giao điểm của hai tia khúc xạ (hoặc giao điểm của đường kéo dài, nếu là ảnh ảo).",
  },
  {
    id: "lens-pre-image", topic: "image", difficulty: 2, kind: "single",
    prompt: "Đặt một vật trước thấu kính hội tụ, cách thấu kính một khoảng lớn hơn hai lần tiêu cự. Ảnh thu được có tính chất nào?",
    choices: [
      { value: "realsmall", label: "Ảnh thật, ngược chiều và nhỏ hơn vật" },
      { value: "reallarge", label: "Ảnh thật, ngược chiều và lớn hơn vật" },
      { value: "virtual", label: "Ảnh ảo, cùng chiều và lớn hơn vật" },
      { value: "same", label: "Ảnh thật, cùng chiều và bằng vật" },
    ],
    answers: ["realsmall"],
    explanation: "Với thấu kính hội tụ, khi vật ở ngoài khoảng hai lần tiêu cự (d > 2f) thì ảnh là ảnh thật, ngược chiều với vật và nhỏ hơn vật. Đây là nguyên tắc hoạt động của máy ảnh.",
  },
  {
    id: "lens-post-image", topic: "image", difficulty: 2, kind: "single",
    prompt: "Một vật được đặt trước thấu kính hội tụ tiêu cự 8 cm, cách thấu kính 5 cm. Dự đoán tính chất ảnh và chọn lý do đúng.",
    choices: [
      { value: "virtual", label: "Ảnh ảo, cùng chiều, lớn hơn vật, vì vật nằm trong khoảng tiêu cự" },
      { value: "real", label: "Ảnh thật, ngược chiều, lớn hơn vật, vì thấu kính hội tụ luôn cho ảnh thật" },
      { value: "none", label: "Không có ảnh, vì vật ở quá gần thấu kính" },
    ],
    answers: ["virtual"],
    explanation: "Khi vật nằm trong khoảng tiêu cự của thấu kính hội tụ (d < f), hai tia khúc xạ không cắt nhau mà chỉ đường kéo dài của chúng cắt nhau, nên ảnh là ảnh ảo, cùng chiều và lớn hơn vật. Đó là cách kính lúp hoạt động.",
  },
];

const practice: LensQuestion[] = [
  // --- Nhận dạng thấu kính ---
  {
    id: "lens-type-shape", topic: "lens-type", difficulty: 1, kind: "single",
    prompt: "Thấu kính hội tụ thường có hình dạng nào?",
    choices: [
      { value: "convex", label: "Phần giữa dày hơn phần rìa" },
      { value: "concave", label: "Phần giữa mỏng hơn phần rìa" },
      { value: "flat", label: "Hai mặt đều phẳng và song song" },
    ],
    answers: ["convex"],
    explanation: "Thấu kính hội tụ (thấu kính lồi) có phần giữa dày hơn phần rìa. Nhờ đó các tia sáng ở xa trục bị lệch nhiều hơn và cả chùm tia tụ về tiêu điểm.",
  },
  {
    id: "lens-type-material", topic: "lens-type", difficulty: 1, kind: "single",
    prompt: "Thấu kính thường được làm từ vật liệu nào, và vì sao vật liệu đó phù hợp?",
    choices: [
      { value: "transparent", label: "Vật liệu trong suốt như thủy tinh hoặc nhựa trong, để ánh sáng truyền qua được" },
      { value: "metal", label: "Kim loại, để phản xạ ánh sáng tốt hơn" },
      { value: "opaque", label: "Vật liệu không trong suốt, để chặn ánh sáng tạo bóng rõ" },
    ],
    answers: ["transparent"],
    explanation: "Thấu kính hoạt động dựa trên sự khúc xạ ánh sáng khi truyền qua nó, nên phải làm từ vật liệu trong suốt (thủy tinh, nhựa trong...) để ánh sáng đi qua được hai mặt của thấu kính.",
  },
  {
    id: "lens-type-magnifier", topic: "lens-type", difficulty: 2, kind: "single",
    prompt: "Dùng một thấu kính soi dòng chữ nhỏ trên trang sách, thấy dòng chữ hiện ra to hơn và cùng chiều. Đó là loại thấu kính nào?",
    choices: [
      { value: "converging", label: "Thấu kính hội tụ, với vật đặt trong khoảng tiêu cự" },
      { value: "diverging", label: "Thấu kính phân kì, vì ảnh cùng chiều với vật" },
      { value: "either", label: "Loại nào cũng được, vì thấu kính đều phóng to ảnh" },
    ],
    answers: ["converging"],
    explanation: "Chỉ thấu kính hội tụ mới cho ảnh ảo lớn hơn vật, khi vật đặt trong khoảng tiêu cự. Thấu kính phân kì cũng cho ảnh ảo cùng chiều nhưng luôn nhỏ hơn vật, nên không dùng làm kính lúp.",
  },
  {
    id: "lens-type-diverging", topic: "lens-type", difficulty: 3, kind: "multiple",
    prompt: "Chọn các phát biểu đúng về thấu kính phân kì.",
    choices: [
      { value: "edge", label: "Phần rìa dày hơn phần giữa" },
      { value: "spread", label: "Chùm tia song song trục chính sau thấu kính thì loe rộng ra" },
      { value: "virtualonly", label: "Với vật thật, ảnh thu được luôn là ảnh ảo và nhỏ hơn vật" },
      { value: "realimage", label: "Có thể cho ảnh thật nếu đặt vật ngoài khoảng hai lần tiêu cự" },
    ],
    answers: ["edge", "spread", "virtualonly"],
    explanation: "Thấu kính phân kì có mép dày, làm chùm tia song song loe ra, và với mọi vật thật nó chỉ cho ảnh ảo cùng chiều, nhỏ hơn vật, nằm trong khoảng tiêu cự. Nó không bao giờ cho ảnh thật của vật thật.",
  },
  {
    id: "lens-type-air", topic: "lens-type", difficulty: 3, kind: "single",
    prompt: "Ánh sáng truyền qua thấu kính bị đổi hướng tại hai mặt của thấu kính. Hiện tượng vật lí nào là nguyên nhân của việc đổi hướng đó?",
    choices: [
      { value: "refraction", label: "Khúc xạ ánh sáng khi truyền qua hai môi trường khác nhau" },
      { value: "reflection", label: "Phản xạ ánh sáng trên bề mặt thấu kính" },
      { value: "absorption", label: "Sự hấp thụ ánh sáng bên trong thấu kính" },
    ],
    answers: ["refraction"],
    explanation: "Thấu kính hoạt động dựa trên khúc xạ: tia sáng bị đổi hướng khi đi từ không khí vào chất làm thấu kính và khi ra lại không khí. Hình dạng mặt thấu kính quyết định chùm tia tụ lại hay loe ra.",
  },

  // --- Tiêu điểm và tiêu cự ---
  {
    id: "lens-focal-two", topic: "focal", difficulty: 1, kind: "single",
    prompt: "Một thấu kính có mấy tiêu điểm và chúng nằm thế nào?",
    choices: [
      { value: "two", label: "Hai tiêu điểm, nằm đối xứng hai bên thấu kính trên trục chính" },
      { value: "one", label: "Một tiêu điểm duy nhất, nằm ở tâm thấu kính" },
      { value: "many", label: "Vô số tiêu điểm, rải khắp mặt thấu kính" },
    ],
    answers: ["two"],
    explanation: "Mỗi thấu kính có hai tiêu điểm nằm trên trục chính, đối xứng nhau qua quang tâm O và cách O một khoảng bằng tiêu cự f.",
  },
  {
    id: "lens-focal-sun", topic: "focal", difficulty: 2, kind: "single",
    prompt: "Hướng một thấu kính hội tụ về phía Mặt Trời rồi di chuyển tờ giấy phía sau cho tới khi thấy một điểm sáng nhỏ và rõ nhất. Khoảng cách từ thấu kính tới tờ giấy đo được 15 cm. Con số 15 cm cho biết điều gì?",
    choices: [
      { value: "focal", label: "Tiêu cự của thấu kính, vì tia sáng từ Mặt Trời coi như song song" },
      { value: "double", label: "Hai lần tiêu cự của thấu kính" },
      { value: "nothing", label: "Không cho biết gì về thấu kính, chỉ là khoảng cách tùy ý" },
    ],
    answers: ["focal"],
    explanation: "Mặt Trời ở rất xa nên chùm tia tới coi như song song với trục chính. Chùm tia này tụ đúng tại tiêu điểm, vậy khoảng cách từ thấu kính đến điểm sáng chính là tiêu cự f = 15 cm.",
  },
  {
    id: "lens-focal-compare", topic: "focal", difficulty: 2, kind: "single",
    prompt: "Hai thấu kính hội tụ có tiêu cự lần lượt f₁ = 5 cm và f₂ = 20 cm. Thấu kính nào làm chùm tia song song tụ lại nhanh hơn, tức gần thấu kính hơn?",
    choices: [
      { value: "short", label: "Thấu kính có f₁ = 5 cm" },
      { value: "long", label: "Thấu kính có f₂ = 20 cm" },
      { value: "equal", label: "Hai thấu kính tụ sáng ở cùng một vị trí" },
    ],
    answers: ["short"],
    explanation: "Tiêu cự càng nhỏ thì tiêu điểm càng gần thấu kính, nghĩa là thấu kính làm tia sáng lệch mạnh hơn. Thấu kính f = 5 cm tụ chùm tia ở ngay 5 cm sau thấu kính.",
  },
  {
    id: "lens-focal-axis", topic: "focal", difficulty: 3, kind: "multiple",
    prompt: "Chọn các phát biểu đúng về trục chính và quang tâm của thấu kính.",
    choices: [
      { value: "centre", label: "Quang tâm O là điểm mà tia sáng qua nó thì truyền thẳng" },
      { value: "axis", label: "Trục chính là đường thẳng đi qua quang tâm và vuông góc với mặt thấu kính" },
      { value: "onaxis", label: "Hai tiêu điểm đều nằm trên trục chính" },
      { value: "anywhere", label: "Trục chính có thể là bất kỳ đường thẳng nào cắt thấu kính" },
    ],
    answers: ["centre", "axis", "onaxis"],
    explanation: "Quang tâm O nằm ở giữa thấu kính, tia qua O truyền thẳng. Trục chính là đường thẳng qua O và vuông góc với mặt thấu kính; hai tiêu điểm nằm trên trục chính này. Một đường thẳng cắt thấu kính bất kỳ không phải là trục chính.",
  },

  // --- Đường truyền tia sáng ---
  {
    id: "lens-rays-centre", topic: "rays", difficulty: 1, kind: "single",
    prompt: "Tia sáng tới đi qua quang tâm O của thấu kính thì tia khúc xạ thế nào?",
    choices: [
      { value: "straight", label: "Tiếp tục truyền thẳng theo phương cũ" },
      { value: "focus", label: "Bị lệch và đi qua tiêu điểm" },
      { value: "parallel", label: "Bị lệch thành tia song song với trục chính" },
    ],
    answers: ["straight"],
    explanation: "Tia sáng đi qua quang tâm O truyền thẳng, không đổi hướng. Đây là tia đặc biệt dễ vẽ nhất khi dựng ảnh.",
  },
  {
    id: "lens-rays-parallel", topic: "rays", difficulty: 2, kind: "single",
    prompt: "Với thấu kính hội tụ, tia tới song song với trục chính cho tia khúc xạ như thế nào?",
    choices: [
      { value: "throughfocus", label: "Đi qua tiêu điểm ở phía bên kia thấu kính" },
      { value: "stillparallel", label: "Vẫn song song với trục chính" },
      { value: "throughcentre", label: "Đi qua quang tâm O" },
    ],
    answers: ["throughfocus"],
    explanation: "Tia tới song song với trục chính, sau khi qua thấu kính hội tụ sẽ đi qua tiêu điểm phía sau thấu kính. Đây là tính chất định nghĩa nên tiêu điểm.",
  },
  {
    id: "lens-rays-reverse", topic: "rays", difficulty: 3, kind: "single",
    prompt: "Một tia sáng tới thấu kính hội tụ đi qua tiêu điểm F nằm phía trước thấu kính. Tia khúc xạ sẽ có phương thế nào?",
    choices: [
      { value: "parallel", label: "Song song với trục chính" },
      { value: "focus", label: "Đi qua tiêu điểm phía sau thấu kính" },
      { value: "straight", label: "Truyền thẳng không đổi hướng" },
    ],
    answers: ["parallel"],
    explanation: "Đường truyền tia sáng có tính thuận nghịch. Vì tia song song trục chính cho tia khúc xạ qua tiêu điểm, nên ngược lại tia đi qua tiêu điểm sẽ cho tia khúc xạ song song với trục chính.",
  },
  {
    id: "lens-rays-diverging", topic: "rays", difficulty: 3, kind: "single",
    prompt: "Với thấu kính phân kì, tia tới song song trục chính cho tia khúc xạ thế nào?",
    choices: [
      { value: "extend", label: "Loe ra, nhưng đường kéo dài của nó đi qua tiêu điểm phía trước thấu kính" },
      { value: "through", label: "Đi trực tiếp qua tiêu điểm phía sau thấu kính" },
      { value: "straight", label: "Truyền thẳng vì thấu kính phân kì không làm lệch tia sáng" },
    ],
    answers: ["extend"],
    explanation: "Thấu kính phân kì làm chùm tia loe ra, nên các tia khúc xạ không thật sự gặp nhau. Chỉ có đường kéo dài của chúng cắt nhau tại tiêu điểm nằm cùng phía với chùm tia tới. Vì vậy tiêu điểm của thấu kính phân kì là tiêu điểm ảo.",
  },

  // --- Sự tạo ảnh ---
  {
    id: "lens-image-two-types", topic: "image", difficulty: 1, kind: "single",
    prompt: "Ảnh của một vật qua thấu kính được chia thành mấy loại chính, và đó là những loại nào?",
    choices: [
      { value: "two", label: "Hai loại: ảnh thật và ảnh ảo" },
      { value: "three", label: "Ba loại: ảnh thật, ảnh ảo và ảnh lớn" },
      { value: "one", label: "Chỉ một loại duy nhất, vì mọi thấu kính cho ảnh giống nhau" },
    ],
    answers: ["two"],
    explanation: "Ảnh qua thấu kính chỉ có hai loại: ảnh thật (do các tia sáng thật sự gặp nhau, hứng được trên màn) và ảnh ảo (do đường kéo dài của tia sáng gặp nhau, không hứng được trên màn).",
  },
  {
    id: "lens-image-2f", topic: "image", difficulty: 2, kind: "single",
    prompt: "Vật được đặt trước thấu kính hội tụ, cách thấu kính đúng bằng hai lần tiêu cự. Ảnh thu được thế nào?",
    choices: [
      { value: "equal", label: "Ảnh thật, ngược chiều và bằng vật" },
      { value: "larger", label: "Ảnh thật, ngược chiều và lớn hơn vật" },
      { value: "smaller", label: "Ảnh thật, ngược chiều và nhỏ hơn vật" },
      { value: "virtual", label: "Ảnh ảo, cùng chiều và bằng vật" },
    ],
    answers: ["equal"],
    explanation: "Khi d = 2f, ảnh cũng hiện ở cách thấu kính 2f về phía bên kia, là ảnh thật, ngược chiều và có độ lớn bằng vật. Đây là vị trí ranh giới giữa ảnh nhỏ hơn và ảnh lớn hơn vật.",
  },
  {
    id: "lens-image-between", topic: "image", difficulty: 2, kind: "single",
    prompt: "Vật đặt trước thấu kính hội tụ, ở khoảng giữa tiêu điểm F và điểm cách thấu kính hai lần tiêu cự. Ảnh thu được thế nào?",
    choices: [
      { value: "reallarger", label: "Ảnh thật, ngược chiều và lớn hơn vật" },
      { value: "realsmaller", label: "Ảnh thật, ngược chiều và nhỏ hơn vật" },
      { value: "virtuallarger", label: "Ảnh ảo, cùng chiều và lớn hơn vật" },
    ],
    answers: ["reallarger"],
    explanation: "Khi f < d < 2f, ảnh là ảnh thật, ngược chiều và lớn hơn vật, hiện ở phía bên kia thấu kính và cách thấu kính hơn 2f. Đây là nguyên tắc của máy chiếu.",
  },
  {
    id: "lens-image-screen", topic: "image", difficulty: 3, kind: "single",
    prompt: "Bạn Lan muốn hứng ảnh của một vật lên màn chắn. Loại ảnh nào có thể hứng được trên màn, và vì sao?",
    choices: [
      { value: "real", label: "Ảnh thật, vì các tia sáng thực sự gặp nhau tại vị trí ảnh" },
      { value: "virtual", label: "Ảnh ảo, vì ảnh ảo bao giờ cũng lớn và rõ hơn" },
      { value: "both", label: "Cả ảnh thật và ảnh ảo đều hứng được nếu màn đủ lớn" },
    ],
    answers: ["real"],
    explanation: "Chỉ ảnh thật hứng được trên màn, vì tại đó các tia sáng thật sự cắt nhau và năng lượng sáng tập trung. Ảnh ảo chỉ là giao điểm của đường kéo dài các tia, không có ánh sáng thật tới nên không hiện lên màn.",
  },
  {
    id: "lens-image-atf", topic: "image", difficulty: 3, kind: "single",
    prompt: "Vật được đặt đúng tại tiêu điểm F của một thấu kính hội tụ. Điều gì xảy ra với ảnh?",
    choices: [
      { value: "noimage", label: "Không tạo được ảnh rõ, vì các tia khúc xạ song song nên không cắt nhau" },
      { value: "atfocus", label: "Ảnh thật hiện ngay tại tiêu điểm phía bên kia thấu kính" },
      { value: "sameplace", label: "Ảnh ảo hiện đúng tại vị trí của vật" },
    ],
    answers: ["noimage"],
    explanation: "Vật ở tại tiêu điểm thì chùm tia sau thấu kính trở thành chùm song song, các tia không cắt nhau nên không tạo được ảnh rõ trên màn. Người ta nói ảnh ở vô cực.",
  },
];

export function buildLensAiBank(): LensQuestion[] {
  // Deep copies so a session snapshot stays stable even if the bank is edited later.
  return [
    ...JSON.parse(JSON.stringify(anchors)) as LensQuestion[],
    ...JSON.parse(JSON.stringify(practice)) as LensQuestion[],
  ];
}
