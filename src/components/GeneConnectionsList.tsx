import React from "react";
import { withStyles, createStyles, Theme } from "@material-ui/core/styles";
import GeneListElement from "./GeneListElement";
import { Box, TablePagination, Paper } from "@material-ui/core";
import { useQuery, gql } from "@apollo/client";
import { Title } from "./Title/Title";

import { Gene } from "../generated/graphql";
import SearchField from "./SearchField/SearchField";
import { getPageValue, getRowsPerPageValue } from "../util/PaginationParams";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      maxWidth: "100%",
      height: "89%",
      marginTop: theme.spacing(1),
      padding: theme.spacing(1),
      overflowX: "auto",
      overflowY: "hidden",
      margin: "auto",
    },
    container: {
      height: "85%",
      width: "100%",
      paddingTop: "80px",
    },
    elementList: {
      height: "100%",
      overflowY: "scroll",
    },
  });

const GET_GENES = gql`
  query genePaginateQuery(
    $first: Int
    $offset: Int
    $orderBy: [_GeneOrdering]
    $filter: _GeneFilter
  ) {
    Gene(first: $first, offset: $offset, orderBy: $orderBy, filter: $filter) {
      sid
      transcripts {
        transcript {
          sid
          proteins {
            protein {
              sid
              name
            }
          }
        }
      }
      mapsGeneSymbols {
        source
        symbol {
          sid
        }
      }
    }
  }
`;

function GeneConnectionsList(props: any) {
  const ROWS_PER_PAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];
  const urlQueryParams = new URLSearchParams(window.location.search);

  let rowsPerPageInit = getRowsPerPageValue(2, ROWS_PER_PAGE_OPTIONS);
  let pageInit = getPageValue(0);

  const { classes } = props;
  const [order] = React.useState<"asc" | "desc">("asc");
  const [orderBy] = React.useState("sid");
  const [page, setPage] = React.useState(pageInit);
  const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageInit);
  const [filterState, setFilterState] = React.useState({
    searchTermFilter: "",
  });

  const getFilter = () => {
    if (filterState.searchTermFilter.length > 0) {
      return {
        // OR: [
        //   {sid_contains: filterState.searchTermFilter}
        // ]
        OR: [
          // {Full_name_from_nomenclature_authority_contains: filterState.searchTermFilter},
          // {name_contains: filterState.searchTermFilter},
          {
            mapsGeneSymbols_some: {
              symbol: {
                sid_contains: filterState.searchTermFilter,
              },
            },
          },
        ],
      };
    }
  };

  const { loading, data, error } = useQuery(GET_GENES, {
    variables: {
      first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order,
      filter: getFilter(),
    },
  });

  // const handleSortRequest = (property: any) => {
  //   const newOrderBy = property
  //   let newOrder: SortDirection = 'desc'

  //   if (orderBy === property && order === 'desc') {
  //     newOrder = 'asc'
  //   }

  //   setOrder(newOrder)
  //   setOrderBy(newOrderBy)
  // }

  const setUrlQueryParams = (newPage: any, newRowsPerPage: any) => {
    urlQueryParams.set("page", (newPage + 1).toString());
    urlQueryParams.set("rowsPerPage", newRowsPerPage.toString());
    props.history.push(
      window.location.pathname + "?" + urlQueryParams.toString()
    );
  };

  const handleFilterChange = (filterName: any) => (event: any) => {
    const val = event.target.value;

    setFilterState((oldFilterState) => ({
      ...oldFilterState,
      [filterName]: val,
    }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setUrlQueryParams(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setUrlQueryParams(0, event.target.value);
  };

  return (
    <Paper className={classes.root}>
      <Title>Gene List</Title>
      <SearchField
        value={filterState.searchTermFilter}
        onChange={handleFilterChange("searchTermFilter")}
      />
      <div className={classes.container}>
        {loading && !error && <p>Loading...</p>}
        {error && !loading && <p>Error</p>}
        {data &&
          !loading &&
          !error &&
          ((data.Gene.length > 0 && (
            <Box className={classes.elementList}>
              {data.Gene.map((gene: Gene) => (
                <GeneListElement key={gene.sid} gene={gene} />
              ))}
            </Box>
          )) || <p>No results</p>)}
      </div>
      <TablePagination
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        component="div"
        count={-1}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </Paper>
  );
}

export default withStyles(styles)(GeneConnectionsList);
