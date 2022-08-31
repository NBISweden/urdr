import "../index.css";
import React from "react";
import { AuthContext } from "../components/AuthProvider";
import { HeaderUser } from "../components/HeaderUser";
import { Row } from "../components/Row";
import { Cell } from "../components/Cell";
import { IssueActivityPair, FetchedTimeEntry } from "../model";
import { QuickAdd } from "../components/QuickAdd";
import weektravel from "../images/weektravel.png";

export const Help = () => {
  const context = React.useContext(AuthContext);
  const exampleIAP: IssueActivityPair = {
    activity: {
      id: 1,
      name: "Test activity",
    },
    issue: {
      id: 1,
      subject: "Test issue",
    },
    custom_name: "Test custom name",
    is_hidden: false,
  };
  const exampleEntry: FetchedTimeEntry = {
    id: 1,
    project: {
      id: 1,
      name: "Test project",
    },
    issue: {
      id: 1,
    },
    user: {
      id: 1,
      name: "Test user",
    },
    activity: {
      id: 1,
      name: "Test activity",
    },
    hours: 1,
    comments: "Test comments",
    spent_on: "2020-01-01",
    created_on: "2020-01-01",
    updated_on: "2020-01-01",
  };
  return (
    <>
      <header className="page-header">
        <h1 className="help-title">What is urdr?</h1>
        <HeaderUser username={context.user ? context.user.login : ""} />
      </header>
      <main className="help-wrapper">
        <h2 className="help-subtitle">Introduction</h2>
        <p className="help-info">
          The purpose of this website is to ease the process of logging time on
          the <a href="https://projects.nbis.se">NBIS Redmine instance</a>. The
          usual procedure for logging time with Redmine involves selecting an
          issue and an activity for reporting your time. In urdr, issues are
          strictly linked to valid activities, thus making it simpler to do time
          reporting accurately. The time reporting page offers a
          spreadsheet-like grid for time entry reporting, together with the
          possibility to navigate over different weeks. The report view is
          primarily made up of a header containing a date picker and arrow
          buttons to navigate between weeks, as well as a user dropdown menu.
          Below, you find the time entries grid, and the bottom bar including
          the feature for adding new rows and saving your changes.
        </p>
        <h2 className="help-subtitle">What is a row?</h2>
        <p className="help-info">
          Within the context of the urdr system, we refer to a row as to the
          visual element on the page where the time entries of a given
          issue-acivity pair are displayed for one specific week. There are two
          types of rows: favourite and recent rows.
        </p>
        <h2 className="help-subtitle">Favourite and recent rows</h2>
        <p className="help-info">
          The following row has been marked as favourite so it will always
          appear at the top of the list. Rows are marked as favourite /
          non-favourite after clicking on the star button present next to the
          title of the corresponding issue. It's worth noting that favourite
          rows are saved across sessions. Moreover, the order of the favourite
          rows can be changed by drag and dropping the row using the
          drag–and–drop handle icon at the left-most position of the row.
        </p>
        <p className="help-info">
          Favourite rows can be given a custom name by editing the text area
          next to the issue number. The custom name is saved after switching the
          focus to another element on the page, or clicking away. The original
          names of the rows can be seen after hovering over the text area. When
          unfavouriting a row, the custom name is reset to the original name.
        </p>
        <Row
          key={1}
          topic={exampleIAP}
          days={[new Date()]}
          rowHours={[1]}
          rowEntries={[exampleEntry]}
          getRowSum={() => 1}
          onToggleHide={() => {}}
          isFav={true}
          onToggleFav={() => {}}
          onFavNameUpdate={() => {}}
          onCellUpdate={() => {}}
        ></Row>
        <p className="help-info">
          The next one is a recent row. The issues shown here are the ones you
          have most recently logged time on, based on the week you are currently
          looking at. Thus, recent rows change as you navigate across different
          weeks or as you add new time entries. If desired, these type of rows
          can be hidden after clicking on the hide button to the far left.
        </p>
        <Row
          key={2}
          topic={exampleIAP}
          days={[new Date()]}
          rowHours={[2]}
          rowEntries={[exampleEntry]}
          getRowSum={() => 2}
          onToggleHide={() => {}}
          isFav={false}
          onToggleFav={() => {}}
          onFavNameUpdate={() => {}}
          onCellUpdate={() => {}}
        ></Row>
        <h2 className="help-subtitle">Hidden rows</h2>
        <p className="help-info">
          Below all rows that are visible by default you find a button saying
          "Show hidden rows". Clicking the button will open a section below that
          lists all rows you have ever hidden. You can make a row a favorite by
          clicking on the star, or move it up to the list of recent rows by
          clicking on the eye symbol. You can also move a row back from the list
          of hidden rows to the list of recent rows by using the "Adding new
          rows" feature (see below). You can collapse the whole section again by
          clicking on the button again.
        </p>
        <Row
          key={3}
          topic={exampleIAP}
          days={[new Date()]}
          rowHours={[3]}
          rowEntries={[exampleEntry]}
          getRowSum={() => 3}
          onToggleHide={() => {}}
          isHidden={true}
          onToggleFav={() => {}}
          onFavNameUpdate={() => {}}
          onCellUpdate={() => {}}
        ></Row>
        <h2 className="help-subtitle">Adding new rows</h2>
        <p className="help-info">
          In order to add a new row, you first find an issue by using its id or
          it's subject, and then select an activity, which will be linked to the
          issue. After selecting your desired issue and clicking on the plus
          button, a new row will be appended to the bottom of the list of recent
          rows.
        </p>
        <QuickAdd addIssueActivity={() => {}}></QuickAdd>
        <h2 className="help-subtitle">The sum row</h2>
        <p className="help-info">
          A cell in the sum row shows the sum of all time entries logged on
          different rows on the corresponding day. It is worth noting that the
          sum also contains entries that have been hidden from the list of
          recent rows. In case the number displayed in a sum field doesn't seem
          to fit to the time entries displayed above, check the section with
          hidden rows.
        </p>
        <h2 className="help-subtitle">Adding or updating time entries</h2>
        <p className="help-info">
          One may log time by simply clicking on the cell corresponding to the
          desired date. If the cell is emptied, the underlying time entry will
          be deleted. It's of course also possible to update existing values of
          a cell. All changes made to a cell are saved only after clicking on
          the <b>"Save Changes"</b> button.
        </p>
        <p className="help-info">
          It is also possible to add a comment to a time entry by clicking on
          the triangle present at the top right of a cell. The color of this
          icon is grey when a comment has not been saved yet:
        </p>
        <div className="centered">
          <Cell
            topic={exampleIAP}
            date={new Date()}
            hours={1}
            comments={""}
            entryId={1}
            onCellUpdate={() => {}}
            onFocusRow={() => {}}
            onBlurRow={() => {}}
          />
        </div>
        <p className="help-info">
          However, once the comment has been saved along with the time entry,
          the triangle turns black:
        </p>
        <div className="centered">
          <Cell
            topic={exampleIAP}
            date={new Date()}
            hours={1}
            comments={"Test comment"}
            entryId={1}
            onCellUpdate={() => {}}
            onFocusRow={() => {}}
            onBlurRow={() => {}}
          />
        </div>
        <h2 className="help-subtitle">Time travelling</h2>
        <p className="help-info">
          Users can navigate across different weeks by using the left and right
          arrow or using the week picker. The week picker is displayed after
          clicking on the button containing a calendar icon and the current week
          number. It's worth noting that users can also go back to previously
          visited weeks by using the browser's back button.
        </p>
        <p className="help-info">
          The URL displayed in your browser will show which year and week you
          are currently looking at. That makes it possible to note down a link
          to a certain week in urdr, in case you know you want to revisit that
          week at a later point.
        </p>
        <div className="centered">
          <img
            src={weektravel}
            alt="time travelling calendar"
            className="weektravel-img"
          />
        </div>
        <h2 className="help-subtitle">Keyboard shortcuts</h2>
        <p className="help-info">
          The following keyboard shortcuts are currently available when
          navigating on the spreadsheet:
        </p>
        <ul className="help-info">
          <li>
            <b>Ctrl + S</b> - Save changes
          </li>
          <li>
            <b>Ctrl + A</b> - Switch the focus to the issue search component
          </li>
        </ul>
        <h2 className="help-subtitle">Known limitations</h2>
        <h3 className="help-h3">Double time entries</h3>
        <p className="help-info">
          In Redmine it's possible to create two time entries for the same
          issue-activity pair per day. You might have done that in the past, and
          for example had two different comments on the different time entries.
          As urdr only has one cell per day and row (i.e. issue-activity pair),
          you will only see one of these entries displayed in the interface. The
          sum row and column however will contain both entries.{" "}
          <b>
            In this case, the number of hours displayed as sum will not match
            what you actually see on the page.
          </b>
        </p>
        <h3 className="help-h3">Hidden rows with time entries</h3>
        <p className="help-info">
          If you hide a row in urdr, it stays hidden even when you time travel.
          If you move to a week in which the hidden row has time entries, the
          row will still not be displayed in the rows shown by default. You need
          to expand the list of hidden rows to see it. However, the time entries
          in hidden rows will be included in the sum row in the bottom of the
          spreadsheet regardless if the hidden rows list is expanded or not.{" "}
          <b>
            In this case, the number of hours displayed as sum will not match
            what you actually see on the page, unless you expand the list of
            hidden rows.
          </b>
        </p>
      </main>
    </>
  );
};
