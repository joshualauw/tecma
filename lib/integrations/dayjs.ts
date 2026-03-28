import dayjs from "dayjs";
import "dayjs/locale/id";

import duration from "dayjs/plugin/duration";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(updateLocale);

dayjs.locale("id");

export default dayjs;
